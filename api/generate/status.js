import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { generateUuid } = req.body;

  if (!generateUuid) {
    return res.status(400).json({ error: '缺少 generateUuid 参数' });
  }

  try {
    const queryRes = await fetch('https://openapi.liblibai.cloud/api/generate/comfy/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generateUuid })
    });

    const text = await queryRes.text();

    // 🚨 原样输出 liblib 的全部响应内容（文本形式）
    return res.status(200).json({
      raw: text
    });

  } catch (err) {
    return res.status(500).json({ error: "查询失败：" + err.message });
  }
}
