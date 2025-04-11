const fetch = require('node-fetch'); // 引入 node-fetch 用于发送请求
const crypto = require('crypto');

module.exports = async (req, res) => {
  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  
  // 获取请求体内容
  const { prompt } = req.body;

  // 生成签名
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

  const url = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  // 向 Liblib API 发送请求
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.code !== 0) {
      return res.status(400).json({ error: "生成失败: " + data.msg });
    }

    // 获取生成的 UUID
    const generateUuid = data.data.generateUuid;
    return res.status(200).json({ generateUuid });
  } catch (error) {
    return res.status(500).json({ error: "请求失败，请稍后再试" });
  }
};
