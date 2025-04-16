import crypto from "crypto";

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
    const libResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: { flower, jellyfish }
      })
    });

    const data = await libResponse.json();
    const uuid = data?.data?.generateUuid;

    // 拿图像
    const imageResponse = await fetch(`https://openapi.liblibai.cloud/api/generate/comfyui/image/${uuid}`);
    const imageData = await imageResponse.json();

    return res.status(200).json({ imageUrl: imageData?.data?.url || null });
  } catch (error) {
    console.error("Liblib 请求失败：", error);
    return res.status(500).json({ error: "生成失败，请稍后再试" });
  }
}
