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

  // 生成请求签名
  const uri = "/api/generate/comfyui/app";
  const stringToSign = uri + "&" + timestamp + "&" + nonce;
  const signature = crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const generateUrl = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;
  console.log("生成签名的 URL：", generateUrl);

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

  try {
    // 调用生成接口
    const response = await fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log("生成请求返回的数据：", result); // 打印返回的数据

    if (result.code !== 0) {
      console.error("生成请求失败，错误信息：", result);
      return res.status(500).json({ error: "生成失败：" + result.msg });
    }

    // 提取图像 URL
    const imageUrl = result.data.images && result.data.images[0] ? result.data.images[0].imageUrl : null;
    if (!imageUrl) {
      return res.status(500).json({ error: "无法获取图像 URL" });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("请求失败：", error);
    return res.status(500).json({ error: "请求发生错误：" + error.message });
  }
};
