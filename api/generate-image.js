export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "只支持 GET 请求" });
  }

  const { generateUuid } = req.query;

  if (!generateUuid) {
    return res.status(400).json({ error: "缺少生成图像所需的 UUID 参数" });
  }

  try {
    const accessKey = process.env.LIBLIB_ACCESS_KEY;
    const secretKey = process.env.LIBLIB_SECRET_KEY;

    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2);
    const uri = `/api/generate/comfyui/image/${generateUuid}`;
    const stringToSign = uri + "&" + timestamp + "&" + nonce;

    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha1", secretKey);
    hmac.update(stringToSign);
    const signature = hmac.digest("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const apiUrl = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

    // 请求图像的 URL
    const imageRes = await fetch(apiUrl);
    const imageData = await imageRes.json();

    if (imageData.code !== 0) {
      return res.status(500).json({ error: "获取图像失败：" + imageData.msg });
    }

    res.status(200).json({ imageUrl: imageData.data.imageUrl }); // 返回图像的 URL

  } catch (error) {
    console.error("请求失败：", error);
    res.status(500).json({ error: "请求发生错误：" + error.message });
  }
}
