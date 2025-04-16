import crypto from "crypto";

// 轮询等待图像生成的函数
async function waitForImage(uuid, maxTries = 10, delay = 2000) {
  for (let i = 0; i < maxTries; i++) {
    const imageResp = await fetch(`https://openapi.liblibai.cloud/api/generate/comfyui/image/${uuid}`);
    const imageJson = await imageResp.json();

    if (imageJson?.data?.url) {
      return imageJson.data.url;
    }

    await new Promise(resolve => setTimeout(resolve, delay)); // 等待 delay 毫秒
  }
  return null; // 超时未生成
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { flower, jellyfish } = req.body;

  const AccessKey = process.env.LIBLIB_ACCESS_KEY || "你的AccessKey";
  const SecretKey = process.env.LIBLIB_SECRET_KEY || "你的SecretKey";

  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 10);
  const uri = "/api/generate/comfyui/app";
  const raw = `${uri}&${timestamp}&${nonce}`;

  const signature = crypto
    .createHmac("sha1", SecretKey)
    .update(raw)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const url = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${AccessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    // 第一步：发送生成请求
    const libResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: { flower, jellyfish }
      })
    });

    const data = await libResponse.json();
    const uuid = data?.data?.generateUuid;

    if (!uuid) {
      return res.status(500).json({ error: "图像生成失败，未返回 UUID" });
    }

    // 第二步：轮询等待图像生成
    const imageUrl = await waitForImage(uuid);

    if (imageUrl) {
      return res.status(200).json({ imageUrl });
    } else {
      return res.status(500).json({ error: "图像生成超时，请稍后再试。" });
    }

  } catch (error) {
    console.error("Liblib 请求失败：", error);
    return res.status(500).json({ error: "生成失败，请稍后再试" });
  }
}
