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

    const contentType = response.headers.get("content-type");

    const text = await response.text();

    // 判断返回是否为 JSON 格式
    if (contentType && contentType.includes("application/json")) {
      const data = JSON.parse(text);

      // 判断是否生成成功
      if (data.status === 'done' && data.result?.[0]?.url) {
        return res.status(200).json({
          status: data.status,
          imageUrl: data.result[0].url,
        });
      } else {
        return res.status(200).json({
          status: data.status || 'processing',
          raw: data,
        });
      }
    } else {
      // 返回非 JSON，说明服务器报错
      return res.status(500).json({
        error: 'Liblib 接口返回错误（非 JSON）',
        raw: text,
      });
    }

  } catch (err) {
    console.error('请求异常:', err);
    return res.status(500).json({ error: '服务器异常', message: err.message });
  }
}
