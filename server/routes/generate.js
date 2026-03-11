import { Router } from 'express';
const router = Router();

// Claude API 프록시 — API 키를 서버에서 관리
router.post('/', async (req, res) => {
  try {
    const { messages, max_tokens = 16000 } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens,
        messages,
      }),
    });

    const data = await response.json();
    let html = (data.content || [])
      .map(b => b.text || '').join('')
      .replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim();

    // HTML 이어쓰기 (잘린 경우)
    if (html && !html.trimEnd().endsWith('</html>')) {
      const contRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 8000,
          messages: [
            ...messages,
            { role: 'assistant', content: html },
            { role: 'user', content: '계속해서 나머지 HTML을 완성해주세요. </html>로 반드시 끝내세요. 코드만 출력.' },
          ],
        }),
      });
      const contData = await contRes.json();
      const cont = (contData.content || []).map(b => b.text || '').join('')
        .replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim();
      html = html + '\n' + cont;
    }

    res.json({ html, usage: data.usage });
  } catch (error) {
    console.error('Claude API 오류:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
