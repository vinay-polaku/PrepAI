// api/generate.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const { model, prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: { message: 'Prompt is required in the request body' } });
  }

  // Retrieve Gemini API Key from request headers (client override) or environment variables
  const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: {
        message: 'No Gemini API key configured. Please set the GEMINI_API_KEY environment variable on the server.'
      }
    });
  }

  const selectedModel = model || 'gemini-2.5-flash';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({
      error: { message: 'Failed to communicate with Gemini API: ' + error.message }
    });
  }
}
