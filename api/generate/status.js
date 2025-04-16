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

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);

  const uri = "/api/generate/comfyui/app"; // 修改路径为 /api/generate/comfyui/app
  const stringToSign = uri + "&" + timestamp + "&" + nonce;
  const signature = crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const generateUrl = `https://openapi.liblibai.cloud${uri}?AccessKey=${accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

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
    const response = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log("生成请求返回的数据：", result);

    if (result.code !== 0) {
      return res.status(500).json({ error: "生成失败：" + result.msg });
    }

    const generateUuid = result.data.generateUuid;

    // 查询状态
    const statusTimestamp = Date.now().toString();
    const statusNonce = Math.random().toString(36).substring(2, 15);
    const statusUri = "/api/generate/comfyui/status"; // 保持一致，路径改为 /api/generate/comfyui/status
    const statusStringToSign = statusUri + "&" + statusTimestamp + "&" + statusNonce;
    const statusSignature = crypto
      .createHmac("sha1", secretKey)
      .update(statusStringToSign)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const statusUrl = `https://openapi.liblibai.cloud${statusUri}?AccessKey=${accessKey}&Signature=${statusSignature}&Timestamp=${statusTimestamp}&SignatureNonce=${statusNonce}`;

    // 等待生成完成（可加轮询机制，这里简单查一次）
    const statusResponse = await fetch(statusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateUuid })
    });

    const statusResult = await statusResponse.json();
    console.log("状态查询返回的数据：", statusResult);

    if (statusResult.code !== 0 || !statusResult.data.imageUrl) {
      return res.status(500).json({ error: "状态查询失败：" + statusResult.msg });
    }

    return res.status(200).json({ imageUrl: statusResult.data.imageUrl });

  } catch (error) {
    console.error("请求异常：", error);
    return res.status(500).json({ error: "请求发生错误：" + error.message });
  }
};
