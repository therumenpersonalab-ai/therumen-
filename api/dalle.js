export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'OpenAI API 키가 서버에 설정되지 않았습니다' });

    const { prompt, size } = req.body || {};
    const safePrompt = `CRITICAL: Generate an image with absolutely NO text, NO letters, NO words, NO typography, NO logos, NO watermarks, NO signage. Image-only composition.\n\n${String(prompt || '')}`;
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: safePrompt,
        n: 1,
        size,
        quality: 'standard',
        response_format: 'b64_json',
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    return res.status(200).json({ image: `data:image/png;base64,${data.data[0].b64_json}` });
  } catch (error) {
    console.error('DALL-E API 오류:', error?.message || error);
    return res.status(500).json({ error: error?.message || '서버 오류' });
  }
}
