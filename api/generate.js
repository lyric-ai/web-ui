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
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const url = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${AccessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  const payload = {
    inputs: {
      "63": { text: jellyfish }, // 对应水母提示词
      "65": { text: flower }     // 对应花朵提示词
    }
  };

  try {
    const libResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await libResponse.json();
    const uuid = data?.data?.generateUuid;

    if (!uuid) {
      console.error("生成UUID失败", data);
      return res.status(500).json({ error: "生成UUID失败" });
    }

    // 查询生成状态（轮询或等待）
    const statusUrl = `https://openapi.liblibai.cloud/api/generate/comfy/status/${uuid}`;
    let imageUrl = null;
    for (let i = 0; i < 10; i++) {
      const statusRes = await fetch(statusUrl);
      const statusData = await statusRes.json();
      imageUrl = statusData?.data?.url;
      if (imageUrl) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    return res.status(200).json({ imageUrl: imageUrl || null });
  } catch (error) {
    console.error("Liblib 请求失败：", error);
    return res.status(500).json({ error: "生成失败，请稍后再试" });
  }
}
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
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const url = `https://openapi.liblibai.cloud/api/generate/comfyui/app?AccessKey=${AccessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    // 第一步：发出生成请求
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
  console.error("Liblib 返回异常：", JSON.stringify(data, null, 2));
  return res.status(500).json({ error: "生成UUID失败", raw: data });
}


    // 第二步：轮询获取图像状态
    let imageUrl = null;
    const maxTries = 10;
    let tries = 0;

    while (tries < maxTries) {
      const statusRes = await fetch(`https://openapi.liblibai.cloud/api/generate/comfy/status/${uuid}`);
      const statusData = await statusRes.json();

      if (statusData?.data?.status === "Success") {
        imageUrl = statusData?.data?.imageList?.[0];
        break;
      }

      if (statusData?.data?.status === "Failed") {
        console.error("生成失败：", statusData);
        return res.status(500).json({ error: "图像生成失败" });
      }

      // 等待 2 秒再轮询
      await new Promise(resolve => setTimeout(resolve, 2000));
      tries++;
    }

    if (!imageUrl) {
      return res.status(500).json({ error: "图像生成超时" });
    }

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Liblib 请求失败：", error);
    return res.status(500).json({ error: "生成失败，请稍后再试" });
  }
}
