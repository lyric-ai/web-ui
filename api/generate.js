const fetch = require("node-fetch");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const { flower, jellyfish } = req.body;
  if (!flower || !jellyfish) {
    return res.status(400).json({ error: "缺少提示词" });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);

  const generateUri = "/api/generate/comfyui";
  const stringToSign = generateUri + "&" + timestamp + "&" + nonce;
  const signature = crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const generateUrl = `https://openapi.liblibai.cloud${generateUri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    // 发起生成请求，获取 UUID
    const generateRes = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `${flower}, ${jellyfish}`,
        model: "你的模型ID", // ⚠️ 这里记得填你在Liblib上的模型ID
        params: {} // 根据需要添加你的参数
      }),
    });

    const generateData = await generateRes.json();
    console.log("生成请求返回的数据：", generateData);

    if (generateData.code !== 0 || !generateData.data.generateUuid) {
      return res.status(500).json({ error: "生成请求失败：" + generateData.msg });
    }

    const generateUuid = generateData.data.generateUuid;

    // ➕ 查询状态（调用 status API）
    const statusRes = await fetch(`${req.headers.host ? `https://${req.headers.host}` : ''}/api/generate/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateUuid }),
    });

    const statusData = await statusRes.json();
    console.log("状态查询返回的数据：", statusData);

    if (statusData.error || !statusData.imageUrl) {
      return res.status(500).json({ error: "状态查询失败" });
    }

    return res.status(200).json({ imageUrl: statusData.imageUrl });

  } catch (err) {
    console.error("出错啦：", err);
    return res.status(500).json({ error: "服务器错误：" + err.message });
  }
};
