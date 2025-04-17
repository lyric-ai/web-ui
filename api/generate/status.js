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
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: '返回内容非 JSON: ' + text });
    }

    if (!queryRes.ok || data?.code !== 0) {
      return res.status(500).json({ error: data?.msg || '查询失败' });
    }

    const statusCode = data.data.generateStatus;
    const imageUrl = data.data.images?.[0]?.imageUrl;

    if (statusCode === 5 && imageUrl) {
      return res.status(200).json({ status: 'done', imageUrl });
    } else {
      return res.status(200).json({ status: `状态码：${statusCode}` });
    }
  } catch (err) {
    return res.status(500).json({ error: "查询失败：" + err.message });
  }
}
