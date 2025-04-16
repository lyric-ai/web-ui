const fetch = require("node-fetch");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const { flower, jellyfish } = req.body;
  if (!flower || !jellyfish) {
    return res.status(400).json({ error: "缺少提示词参数" });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);

  const uri = "/api/generate/comfyui/app"; // 修改路径为 /api/generate/comfyui/app
  const stringToSign = uri + "&" + timestamp + "&" + nonce;
  const signature = crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const generateUrl = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  const requestBody = {
    templateUuid:
