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

    // 创建请求 URL 和签名
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2);
    const uri = "/api/generate/comfyui/app";
    const stringToSign = uri + "&" + timestamp + "&" + nonce;

    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha1", secretKey);
    hmac.update(stringToSign);
    const signature = hmac.digest("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const apiUrl = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

    // 调用生成接口
    const liblibRes = await fetch(apiUrl, {
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

    const generateUuid = result.data.generateUuid;  // 获取生成任务 UUID

    // 调用状态查询接口，检查生成状态
    const statusUrl = `https://openapi.liblibai.cloud/api/generate/comfyui/status?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;
    const statusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": accessKey,
        "SecretKey": secretKey
      },
      body: JSON.stringify({ generateUuid })
    });

    const statusText = await statusResponse.text();
    console.log("liblib 状态查询结果：", statusText);

    let statusResult;
    try {
      statusResult = JSON.parse(statusText); // 尝试转成 JSON
    } catch (e) {
      return res.status(500).json({ error: "状态查询返回结果不是 JSON，原始内容：" + statusText });
    }

    if (statusResult.code !== 0) {
      return res.status(500).json({ error: "状态查询失败：" + statusResult.msg });
    }

    // 获取生成图像 URL
    if (statusResult.data.generateStatus === 5) {
      const imageUrl = statusResult.data.images[0].imageUrl; // 假设返回的是图像的 URL
      res.status(200).json({ imageUrl });
    } else if (statusResult.data.generateStatus === 6) {
      return res.status(500).json({ error: "生成任务失败：" + statusResult.data.generateMsg });
    } else {
      return res.status(400).json({ error: "任务未完成，当前状态: " + statusResult.data.generateStatus });
    }

  } catch (error) {
    console.error("请求失败：", error);
    res.status(500).json({ error: "请求发生错误：" + error.message });
  }
}
