// /api/generate/status.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { generateUuid } = req.body;
  if (!generateUuid) {
    return res.status(400).json({ error: 'Missing generateUuid' });
  }

  const accessKey = process.env.LIBLIB_ACCESS_KEY;
  const secretKey = process.env.LIBLIB_SECRET_KEY;

  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2);
  const uri = "/api/generate/comfy/status";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;

  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha1", secretKey);
  hmac.update(stringToSign);
  const signature = hmac.digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const statusUrl = `https://openapi.liblibai.cloud/api/generate/comfy/status?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    // 使用原生 fetch 代替 node-fetch
    const response = await fetch(statusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateUuid })
    });

    // 输出响应的原始内容以便调试
    const responseBody = await response.text();
    console.log("Response from Liblib API:", responseBody);

    // 尝试解析 JSON 数据
    const data = JSON.parse(responseBody);
    
    if (data.code !== 0) {
      return res.status(500).json({ error: 'Error from Liblib API', message: data.msg });
    }

    // 如果状态为成功，返回结果数据
    res.status(200).json(data.data);
  } catch (err) {
    console.error("Error checking status:", err);
    res.status(500).json({ error: "Failed to check status" });
  }
}
