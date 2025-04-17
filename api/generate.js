export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { flower, jellyfish } = req.body;

  const AccessKey = "NRXABtFaq2nlj-fRV4685Q";
  const SecretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  const apiUrl = "https://openapi.liblibai.cloud/api/generate/comfyui/app";

  const payload = {
    workflow_name: "梦幻水母",
    prompt: {
      "鲜花关键词": flower,
      "水母关键词": jellyfish
    },
    key: {
      access_key: AccessKey,
      secret_key: SecretKey
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.code !== 200 || !data.data || !data.data.task_id) {
      return res.status(500).json({ error: "Liblib 任务提交失败", liblibResponse: data });
    }

    const taskId = data.data.task_id;

    // 等待生成完成
    await new Promise(resolve => setTimeout(resolve, 6000));

    const statusRes = await fetch("https://openapi.liblibai.cloud/api/generate/comfy/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task_id: taskId,
        key: {
          access_key: AccessKey,
          secret_key: SecretKey
        }
      })
    });

    const statusData = await statusRes.json();

    if (statusData.code !== 200 || !statusData.data?.image_list?.[0]) {
      return res.status(500).json({ error: "Liblib 返回图片失败", statusResponse: statusData });
    }

    const imageUrl = statusData.data.image_list[0];
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("服务器错误：", error);
    res.status(500).send("服务器内部错误");
  }
}
