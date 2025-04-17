const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);
  const uri = "/api/generate/comfyui/app";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;

  const signature = crypto.createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://openapi.liblibai.cloud/api/generate/comfyui/app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "AccessKey": accessKey,
      "Signature": signature,
      "Timestamp": timestamp,
      "SignatureNonce": nonce,
    },
    body: JSON.stringify({
      templateUuid: "4df2efa0f18d46dc9758803e478eb51c", // 如果你有自定义 workflow UUID 请替换
      generateParam: { prompt },
    }),
  });

  const data = await response.json();
  return res.status(200).json(data);
};
