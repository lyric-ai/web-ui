// api/generate/status.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { generateUuid } = req.body;
    if (!generateUuid) {
      return res.status(400).json({ error: 'Missing generateUuid' });
    }

    const apiUrl = 'https://openapi.liblibai.cloud/api/generate/comfy/status';
    const headers = {
      'Content-Type': 'application/json',
      // 如果你有签名机制，这里加入签名 Header
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ generateUuid }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Status fetch failed' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Status API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

