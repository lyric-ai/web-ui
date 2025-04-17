import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { generateUuid } = req.body;

  if (!generateUuid) {
    return res.status(400).json({ error: '缺少 generateUuid 参数' });
  }

  const url = `https://api.liblib.ai/api/generate/query?generateUuid=${generateUuid}`;

  try {
    const libRes = await fetch(url);
    const text = await libRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Liblib 响应不是 JSON：", text);
      return res.status(500).json({ error: "返回了非 JSON 内容：" + text });
    }

    if (!libRes.ok) {
      return res.status(libRes.status).json({ error: data?.error || '状态查询失败' });
    }

    // 如果状态完成则拼接图像地址
    if (data.status === 'done' && data?.imageUrls?.[0]) {
      return res.status(200).json({
        status: 'done',
        imageUrl: data.imageUrls[0]
      });
    }

    // 如果未完成则返回原始状态
    return res.status(200).json({ status: data.status || 'unknown' });

  } catch (err) {
    console.error("❌ 状态查询失败：", err);
    return res.status(500).json({ error: '请求失败：' + err.message });
  }
}
