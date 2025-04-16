import crypto from "crypto";
import fetch from "node-fetch";

const accessKey = process.env.LIBLIB_ACCESS_KEY || "你的AccessKey";
const secretKey = process.env.LIBLIB_SECRET_KEY || "你的SecretKey";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { flower, jellyfish } = req.body;
  if (!flower || !jellyfish) {
    return res.status(400).json({ error: "缺少必要的提示词" });
  }

  const mergedPrompt = `${flower} 元素融合成一只 ${jellyfish}`;

  const timestamp = Date.now().toString();
  const signature = crypto.createHmac("sha256", secretKey)
    .update(timestamp)
    .digest("hex");

  try {
    const response = await fetch("https://api.liblib.ai/v1/gen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": accessKey,
        "Timestamp": timestamp,
        "Signature": signature,
      },
      body: JSON.stringify({
        model: "juggernaut-xl-v8",
        prompt: mergedPrompt,
        style: "dreamy",
        size: "1024x1024"
      }),
    });

    const data = await response.json();
    console.log("Liblib 响应内容：", data);
    const uuid = data?.data?.uuid;
    console.log("拿到的 UUID：", uuid);

    if (!uuid) {
      return res.status(500).json({ error: "生成任务创建失败", liblib: data });
    }

    // 等待图像生成完成（轮询）
    const waitForImage = async (uuid, retries = 15, interval = 2000) => {
      for (let i = 0; i < retries; i++) {
        const imageResponse = await fetch(`https://api.liblib.ai/v1/image/${uuid}`, {
          headers: {
            "AccessKey": accessKey,
            "Timestamp": timestamp,
            "Signature": signature,
          },
        });
        const imageData = await imageResponse.json();
        console.log("图像接口响应：", imageData);

        const imageUrl = imageData?.data?.images?.[0]?.url;
        if (imageUrl) return imageUrl;
        await new Promise(r => setTimeout(r, interval));
      }
      return null;
    };

    const imageUrl = await waitForImage(uuid);

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("生成失败：", error);
    res.status(500).json({ error: "服务器错误", detail: error.message });
  }
}
