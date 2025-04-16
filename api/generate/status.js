const fetch = require("node-fetch");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const { generateUuid } = req.body;
  if (!generateUuid) {
    return res.status(400).json({ error: "缺少生成UUID参数" });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);

  const statusUri = "/api/generate/comfy/status";
  const statusStringToSign = statusUri + "&" + timestamp + "&" + nonce;
  const statusSignature = crypto
    .createHmac("sha1", secretKey)
    .update(statusStringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const statusUrl = `https://openapi.liblibai.cloud${statusUri}?AccessKey=${accessKey}&Signature=${statusSignature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    const statusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateUuid })
    });

    const statusResult = await statusResponse.json();
    console.log("状态查询返回的数据：", statusResult);

    if (statusResult.code !== 0 || !statusResult.data.imageUrl) {
      return res.status(500).json({ error: "状态查询失败：" + statusResult.msg });
    }

    return res.status(200).json({ imageUrl: statusResult.data.imageUrl });

  } catch (error) {
    console.error("请求异常：", error);
    return res.status(500).json({ error: "请求发生错误：" + error.message });
  }
};
