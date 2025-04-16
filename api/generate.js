export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "仅支持 POST 请求" });
  }

  const { flower, jellyfish } = req.body;

  if (!flower || !jellyfish) {
    return res.status(400).json({ error: "缺少提示词参数" });
  }

  const ACCESS_KEY = 'NRXABtFaq2nlj-fRV4685Q';
  const SECRET_KEY = 'VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf';

  const payload = {
    inputs: {
      "63": { text: jellyfish },
      "65": { text: flower }
    }
  };

  try {
    // 使用 Vercel 自带的 fetch
    const response = await fetch("https://openapi.liblibai.cloud/api/generate/comfyui/app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": ACCESS_KEY,
        "SecretKey": SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.code !== 200 || !result.data?.task_id) {
      console.error("生成失败：", result);
      return res.status(500).json({ error: "请求生成失败", raw: result });
    }

    const taskId = result.data.task_id;

    const statusResponse = await fetch(`https://openapi.liblibai.cloud/api/generate/comfy/status/?task_id=${taskId}`, {
      method: "GET",
      headers: {
        "AccessKey": ACCESS_KEY,
        "SecretKey": SECRET_KEY
      }
    });

    const statusResult = await statusResponse.json();

    if (statusResult.code !== 200 || !statusResult.data?.image_urls?.[0]) {
      console.error("图像获取失败：", statusResult);
      return res.status(500).json({ error: "图像获取失败", raw: statusResult });
    }

    return res.status(200).json({ imageUrl: statusResult.data.image_urls[0] });

  } catch (err) {
    console.error("请求异常：", err);
    return res.status(500).json({ error: "服务异常", detail: err.message });
  }
}
