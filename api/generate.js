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
    // 发送生成请求
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

    // 查询生成状态并轮询
    let statusResult;
    do {
      const statusTimestamp = Date.now().toString();
      const statusNonce = Math.random().toString(36).substring(2, 15);
      const statusUri = "/api/generate/comfyui/status";
      const statusStringToSign = statusUri + "&" + statusTimestamp + "&" + statusNonce;
      const statusSignature = crypto
        .createHmac("sha1", secretKey)
        .update(statusStringToSign)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const statusUrl = `https://openapi.liblibai.cloud${statusUri}?AccessKey=${accessKey}&Signature=${statusSignature}&Timestamp=${statusTimestamp}&SignatureNonce=${statusNonce}`;

      const statusResponse = await fetch(statusUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateUuid })
      });

      statusResult = await statusResponse.json();
      console.log("状态查询返回的数据：", statusResult);

      if (statusResult.code !== 0 || !statusResult.data.imageUrl) {
        return res.status(500).json({ error: "状态查询失败：" + statusResult.msg });
      }

      // 如果生成任务还未完成，等待 2 秒再查询一次
      if (statusResult.data.generateStatus !== 5) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (statusResult.data.generateStatus !== 5);

    return res.status(200).json({ imageUrl: statusResult.data.imageUrl });

  } catch (error) {
    console.error("请求异常：", error);
    return res.status(500).json({ error: "请求发生错误：" + error.message });
  }
};
