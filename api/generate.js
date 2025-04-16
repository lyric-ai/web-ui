import crypto from "crypto";

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
    const uri = "/api/generate/comfyui/app";  // 请求的 URI 地址
    const stringToSign = `${uri}&${timestamp}&${nonce}`;  // 拼接待签名字符串

    // 使用 HMAC-SHA1 算法加密
    const hmac = crypto.createHmac("sha1", secretKey);
    hmac.update(stringToSign);
    const signature = hmac.digest("base64")
      .replace(/\+/g, "-")  // URL安全Base64替换
      .replace(/\//g, "_")
      .replace(/=+$/, "");  // 移除Base64填充字符

    const apiUrl = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

    // 打印调试信息
    console.log("生成请求 URL：", apiUrl);
    console.log("生成签名：", signature);

    // 发起请求
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

    res.status(200).json({ generateUuid: result.data.generateUuid });

  } catch (error) {
    console.error("请求失败：", error);
    res.status(500).json({ error: "请求发生错误：" + error.message });
  }
}
