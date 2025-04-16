const fetch = require("node-fetch");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const { flower, jellyfish } = req.body;

  if (!flower || !jellyfish) {
    return res.status(400).json({ error: "缺少提示词参数" });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q"; // 从环境变量或配置文件获取
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf"; // 从环境变量或配置文件获取
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);

  // 确保 URI 路径与 API 文档匹配
  const uri = "/api/generate/comfyui/app";
  // 使用花卉和水母的文本生成模型
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
      workflowUuid: "dee7984fcace4d40aa8bc99ff6a4dc36"
    }
  };

  // 计算签名字符串
  const stringToSign = uri + "&" + timestamp + "&" + nonce;
  const signature = crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const url = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

  try {
    // 调用生成接口
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    if (result.code !== 0) {
      return res.status(500).json({ error: "生成失败：" + result.msg });
    }

    const generateUuid = result.data.generateUuid;

    // 查询生成状态
    const statusUrl = `https://openapi.liblibai.cloud/api/generate/comfyui/status?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;
    const statusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generateUuid }),
    });

    const statusResult = await statusResponse.json();
    if (statusResult.code !== 0) {
      return res.status(500).json({ error: "状态查询失败：" + statusResult.msg });
    }

    const imageUrl = statusResult.data.imageUrl; // 假设返回的是图像的 URL
    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("请求失败：", error);
    return res.status(500).json({ error: "请求发生错误：" + error.message });
  }
};
