const fetch = require('node-fetch'); // 引入 fetch 库用于发送请求
const crypto = require('crypto');    // 用于生成 HMAC 签名

module.exports = async (req, res) => {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";

  // 从请求体中获取提示词（prompt）
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 生成请求所需的签名
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);
  const uri = "/api/generate/comfyui/app";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;

  const signature = crypto.createHmac('sha1', secretKey)
    .update(stringToSign)
    .digest('base64')
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // 请求体
  const body = {
    templateUuid: "4df2efa0f18d46dc9758803e478eb51c",
    generateParams: {
      "65": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "text": prompt
        }
      },
      "workflowUuid": "dee7984fcace4d40aa8bc99ff6a4dc36"
    }
  };

  // 构建请求的 URL
  const url = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    // 向 Liblib AI 发送 POST 请求
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // 如果请求失败，返回错误信息
    if (data.code !== 0) {
      return res.status(400).json({ error: "生成失败: " + data.msg });
    }

    // 获取生成的 UUID
    const generateUuid = data.data.generateUuid;
    return res.status(200).json({ generateUuid });
  } catch (error) {
    // 捕获错误并返回 500 错误
    console.error(error); // 打印错误日志
    return res.status(500).json({ error: "请求失败，请稍后再试" });
  }
};
