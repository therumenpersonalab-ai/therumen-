export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { task = 'html', messages, max_tokens = 16000, prompt, size } = req.body || {};

    // AERE 직접 이미지 생성 경로
    if (task === 'ai_image') {
      const safePrompt = `CRITICAL: Generate an image with absolutely NO text, NO letters, NO words, NO typography, NO logos, NO watermarks, NO signage. Image-only composition.\n\n${String(prompt || '')}`;

      if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: safePrompt,
            n: 1,
            size: size || '1024x1024',
            quality: 'standard',
            response_format: 'b64_json',
          }),
        });
        const data = await response.json();
        if (data?.error) return res.status(400).json({ error: data.error.message });
        return res.status(200).json({ image: `data:image/png;base64,${data.data[0].b64_json}`, provider: 'openai' });
      }

      const [w, h] = String(size || '1024x1024').split('x').map((v) => Number(v) || 1024);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${w}&height=${h}&nologo=true`;
      return res.status(200).json({ image: fallbackUrl, provider: 'fallback' });
    }

    // AERE 직접 HTML/문구 처리 경로
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages가 필요합니다.' });
    }

    // 1) Anthropic 우선
    if (process.env.ANTHROPIC_API_KEY) {
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

      return res.status(200).json({ html, usage: data.usage, provider: 'anthropic' });
    }

    // 2) OpenAI fallback (사용자 체감 실패 방지)
    if (process.env.OPENAI_API_KEY) {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages,
          max_tokens: Math.min(Number(max_tokens) || 8000, 8000),
        }),
      });
      const data = await openaiRes.json();
      const html = String(data?.choices?.[0]?.message?.content || '')
        .replace(/```html\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

      if (!html) {
        return res.status(500).json({ error: data?.error?.message || 'AI 응답이 비어 있습니다.' });
      }

      return res.status(200).json({ html, usage: data?.usage, provider: 'openai-fallback' });
    }

    return res.status(400).json({ error: 'AI 서버 키가 설정되지 않았습니다. (ANTHROPIC_API_KEY 또는 OPENAI_API_KEY 필요)' });
  } catch (error) {
    console.error('Generate API 오류:', error?.message || error);
    return res.status(500).json({ error: error?.message || '서버 오류' });
  }
}
