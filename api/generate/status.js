// 文件路径: /api/generate/status.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { generateUuid } = req.body;

  if (!generateUuid) {
    return res.status(400).json({ error: '缺少 generateUuid 参数' });
  }

  try {
    const response = await fetch('https://openapi.liblibai.cloud/api/generate/comfy/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ generateUuid }),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);

      // 返回成功状态（你可以根据 data 的格式再进一步细化）
      if (data.status === 'done' && data.result?.[0]?.url) {
        return res.status(200).json({
          status: data.status,
          imageUrl: data.result[0].url,
        });
      } else {
        return res.status(200).json({
          status: data.status,
          raw: data,
        });
      }

    } catch (jsonErr) {
      console.error('解析 JSON 失败:', text);
      return res.status(500).json({ error: '返回内容不是合法 JSON', raw: text });
    }

  } catch (err) {
    console.error('请求出错:', err);
    return res.status(500).json({ error: '服务器错误', message: err.message });
  }
}
