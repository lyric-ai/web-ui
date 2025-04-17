import fetch from 'node-fetch';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { generateUuid } = req.body;
  if (!generateUuid) {
    return res.status(400).json({ error: '缺少 generateUuid 参数' });
  }

  const accessKey = "NRXABtFaq2nlj-fRV4685Q";
  const secretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
  const uri = "/api/generate/comfy/status";
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 15);
  const stringToSign = `${uri}&${timestamp}&${nonce}`;

  const signature = crypto.createHmac('sha1', secretKey)
    .update(stringToSign)
    .digest('base64')
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const queryParams = new URLSearchParams({
    AccessKey: accessKey,
    Signature: signature,
    Timestamp: timestamp,
    SignatureNonce: nonce
  });

  const url = `https://openapi.liblibai.cloud${uri}?${queryParams.toString()}`;

  try {
    const queryRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generateUuid })
    });

    const text = await queryRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "返回内容不是 JSON：" + text });
    }

    const status = data.data?.generateStatus;
    const imageUrl = data.data?.images?.[0]?.imageUrl;

    if (status === 5 && imageUrl) {
      return res.status(200).json({ status: 'done', imageUrl });
    } else {
      return res.status(200).json({
        status: `生成中 (${status})`,
        percent: data.data?.percentCompleted ?? 0
      });
    }

  } catch (err) {
    return res.status(500).json({ error: "查询失败：" + err.message });
  }
}
