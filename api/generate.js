const fetch = require('node-fetch');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";

  const { flower, jellyfish } = req.body;

  const promptText = `${flower} ${jellyfish}`;

  // 构造签名相关参数
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);
  const uri = "/api/generate/comfyui/app";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;
  const signature = crypto.createHmac('sha1', secretKey)
    .update(stringToSign)
    .digest('base64')
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const body = {
    templateUuid: "4df2efa0f18d46dc9758803e478eb51c",
    generateParams: {
      "65": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "text": promptText
        }
      },
      "workflowUuid": "6eea695bb5714337a95da1d72afe96d5"
    }
  };

  const url = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

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

    return res.status(200).json({ generateUuid: data.data.generateUuid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "请求失败，请稍后再试" });
  }
};
