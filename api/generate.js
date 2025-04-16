import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { flower, jellyfish } = req.body;

  if (!flower || !jellyfish) {
    return res.status(400).json({ error: '缺少提示词参数' });
  }

  try {
    const response = await fetch('https://openapi.liblibai.cloud/api/generate/comfyui/app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': process.env.LIBLIB_ACCESS_KEY,
        'SecretKey': process.env.LIBLIB_SECRET_KEY,
      },
      body: JSON.stringify({
        inputs: {
          "花朵提示词": flower,
          "水母提示词": jellyfish,
        }
      }),
    });

    const result = await response.json();
    console.log("Liblib 返回：", result); // 调试信息

    if (!result?.request_id) {
      return res.status(500).json({ error: '请求生成失败', raw: result });
    }

    const statusRes = await fetch('https://openapi.liblibai.cloud/api/generate/comfy/status/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': process.env.LIBLIB_ACCESS_KEY,
        'SecretKey': process.env.LIBLIB_SECRET_KEY,
      },
      body: JSON.stringify({ request_id: result.request_id }),
    });

    const statusResult = await statusRes.json();
    console.log("状态查询返回：", statusResult); // 调试信息

    if (statusResult?.data?.images?.[0]?.url) {
      return res.status(200).json({ imageUrl: statusResult.data.images[0].url });
    } else {
      return res.status(500).json({ error: '图像生成失败', raw: statusResult });
    }

  } catch (error) {
    console.error('生成图像失败:', error);
    return res.status(500).json({ error: '服务端错误', message: error.message });
  }
}
