import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  // 从请求体中获取花和水母的提示词
  const { flower, jellyfish } = req.body;
  if (!flower || !jellyfish) {
    return res.status(400).json({ error: 'Missing flower or jellyfish prompt' });
  }

  // 请求体中的生成参数
  const requestBody = {
    templateUuid: "4df2efa0f18d46dc9758803e478eb51c",
    generateParams: {
      "63": {
        class_type: "CLIPTextEncode",
        inputs: {
          text: jellyfish
        }
      },
      "65": {
        class_type: "CLIPTextEncode",
        inputs: {
          text: flower
        }
      },
      workflowUuid: "5f7cf756fd804deeac558322dc5bd813"
    }
  };

  // 使用环境变量中的 LIBLIB_ACCESS_KEY 和 LIBLIB_SECRET_KEY
  const accessKey = process.env.LIBLIB_ACCESS_KEY;
  const secretKey = process.env.LIBLIB_SECRET_KEY;

  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2);
  const uri = "/api/generate/comfyui/app";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;

  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha1", secretKey);
  hmac.update(stringToSign);
  const signature = hmac.digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const generateUrl = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    const response = await fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    if (result.code !== 0) {
      return res.status(500).json({ error: "Generation failed: " + result.msg });
    }

    const generateUuid = result.data.generateUuid;

    // 检查生成状态
    const statusUrl = `https://openapi.liblibai.cloud/api/generate/comfy/status?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;
    const checkStatusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generateUuid })
    });

    const statusResult = await checkStatusResponse.json();
    if (statusResult.code === 0 && statusResult.data.generateStatus === 5) {
      const imgUrl = statusResult.data.images[0].imageUrl;
      return res.status(200).json({ imageUrl: imgUrl });
    } else {
      return res.status(500).json({ error: "Failed to generate image or status not ready." });
    }

  } catch (err) {
    console.error("Error during generation process:", err);
    return res.status(500).json({ error: "An error occurred during the generation process." });
  }
}
