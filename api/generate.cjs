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

  // 构造签名
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);
  const uri = "/api/generate/comfyui/app";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;
  const signature = crypto.createHmac('sha1', secretKey)
    .update(stringToSign)
    .digest('base64')
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const body = {
    templateUuid: "4df2efa0f18d46dc9758803e478eb51c",  // 你的 workflow UUID
    generateParams: {
      "65": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "text": promptText
        }
      },
      "74": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "text": promptText
        }
      }
    }
  };

  try {
    const libRes = await fetch("https://api.liblib.ai/api/generate/comfyui/app", {
      method: 'POST',
      headers: {
        'access-key': accessKey,
        'signature': signature,
        'timestamp': timestamp,
        'nonce': nonce,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await libRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Liblib 响应不是 JSON：", text);
      return res.status(500).json({ error: "Liblib 返回了非 JSON 内容：" + text });
    }

    if (!libRes.ok) {
      return res.status(libRes.status).json({ error: data?.error || "生成失败" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ 请求失败：", err);
    return res.status(500).json({ error: "请求失败：" + err.message });
  }
};
