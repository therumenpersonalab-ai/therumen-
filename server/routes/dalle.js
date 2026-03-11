import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'OpenAI API 키가 서버에 설정되지 않았습니다' });

    const { prompt, size } = req.body;
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: 'standard', response_format: 'b64_json' }),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    res.json({ image: `data:image/png;base64,${data.data[0].b64_json}` });
  } catch (error) {
    console.error('DALL-E API 오류:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
