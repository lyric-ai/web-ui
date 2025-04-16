export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const { flower, jellyfish } = req.body;

  if (!flower || !jellyfish) {
    return res.status(400).json({ error: "缺少提示词参数" });
  }

  const requestBody = {
    templateUuid: "4df2efa0f18d46dc9758803e478eb51c",
    generateParams: {
      "63": {
        class_type: "CLIPTextEncode",
        inputs: { text: jellyfish }
      },
      "65": {
        class_type: "CLIPTextEncode",
        inputs: { text: flower }
      },
      workflowUuid: "5f7cf756fd804deeac558322dc5bd813"
    }
  };

  try {
    const accessKey = process.env.LIBLIB_ACCESS_KEY;
const secretKey = process.env.LIBLIB_SECRET_KEY;

const liblibRes = await fetch("https://openapi.liblibai.cloud/api/generate/comfyui/app", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "AccessKey": accessKey,
    "SecretKey": secretKey
  },
      body: JSON.stringify(requestBody)
    });

    const text = await liblibRes.text(); // 不管返回是不是 JSON，都先拿到纯文本
    console.log("liblib 返回内容：", text);

    let result;
    try {
      result = JSON.parse(text); // 尝试转成 JSON
    } catch (e) {
      return res.status(500).json({ error: "返回结果不是 JSON，原始内容：" + text });
    }

    if (result.code !== 0) {
      return res.status(500).json({ error: "生成失败：" + result.msg });
    }

    res.status(200).json({ generateUuid: result.data.generateUuid });

  } catch (error) {
    console.error("请求失败：", error);
    res.status(500).json({ error: "请求发生错误：" + error.message });
  }
}
