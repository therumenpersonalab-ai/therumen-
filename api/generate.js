export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, max_tokens = 16000 } = req.body || {};
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' });
    }

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
      .map((b) => b.text || '')
      .join('')
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

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
            ...(messages || []),
            { role: 'assistant', content: html },
            { role: 'user', content: '계속해서 나머지 HTML을 완성해주세요. </html>로 반드시 끝내세요. 코드만 출력.' },
          ],
        }),
      });
      const contData = await contRes.json();
      const cont = (contData.content || [])
        .map((b) => b.text || '')
        .join('')
        .replace(/```html\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
      html = `${html}\n${cont}`;
    }

    return res.status(200).json({ html, usage: data.usage });
  } catch (error) {
    console.error('Claude API 오류:', error?.message || error);
    return res.status(500).json({ error: error?.message || '서버 오류' });
  }
}
