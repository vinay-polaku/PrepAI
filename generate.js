// api/generate.js

module.exports = async function handler(req, res) {
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

  // Retrieve Gemini API Key from request headers or backend environment variables
  const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
  const apiKeyExists = !!apiKey;

  // Validate model name to prevent invalid/empty strings
  let selectedModel = 'gemini-2.5-flash';
  if (model && typeof model === 'string' && model.trim() !== '') {
    const trimmedModel = model.trim();
    // Validate model pattern to prevent exploits or invalid calls, else fallback
    if (trimmedModel.startsWith('gemini-')) {
      selectedModel = trimmedModel;
    }
  }

  // Log request metadata safely
  console.log(`[Vercel Backend Log] Request received. Model: "${selectedModel}", API Key Exists: ${apiKeyExists}`);

  if (!apiKey) {
    return res.status(500).json({
      error: {
        message: 'No Gemini API key configured. Please set the GEMINI_API_KEY environment variable on Vercel.'
      }
    });
  }

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

    const textResponse = await response.text();
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (parseErr) {
      return res.status(502).json({
        error: {
          message: `Invalid JSON response received from Google API: ${textResponse.slice(0, 150)}`
        }
      });
    }

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
};
