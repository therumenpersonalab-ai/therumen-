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

    // 3) 무키 fallback: 에이레 로컬 처리 (중단 방지)
    const last = messages[messages.length - 1];
    const raw = typeof last?.content === 'string'
      ? last.content
      : Array.isArray(last?.content)
        ? last.content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join('\n')
        : '';

    const htmlMatch = raw.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || raw.match(/<html[\s\S]*<\/html>/i);
    let html = htmlMatch ? htmlMatch[0] : '';

    // HTML이 없으면 최소 안전 스켈레톤 생성
    if (!html) {
      html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>AI 처리 결과</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;background:#f8fafc;color:#0f172a} .box{max-width:900px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px}</style></head><body><div class="box"><h1>에이레 자동 처리 결과</h1><p>요청이 서버 fallback 경로에서 처리되었습니다.</p></div></body></html>`;
    }

    // 간단한 의도 반영(FAQ/카카오/애니메이션 등)
    const reqText = raw.toLowerCase();
    if (reqText.includes('faq') && !/id=["']faq["']|faq/i.test(html)) {
      html = html.replace(/<\/body>/i, `<section id="faq" style="padding:48px 20px;background:#f8fafc"><div style="max-width:980px;margin:0 auto"><h2>자주 묻는 질문</h2><details><summary>예약은 어떻게 하나요?</summary><p>문의 버튼 또는 연락처로 가능해요.</p></details><details><summary>운영 시간은?</summary><p>페이지 하단 연락처 영역에서 확인 가능합니다.</p></details></div></section></body>`);
    }
    if ((reqText.includes('카카오') || reqText.includes('kakao')) && !/pf\.kakao\.com|kakao/i.test(html)) {
      html = html.replace(/<\/body>/i, `<a href="#" style="position:fixed;right:20px;bottom:20px;background:#FEE500;color:#3A1D1D;padding:12px 16px;border-radius:999px;text-decoration:none;font-weight:700;z-index:9999">카카오 상담</a></body>`);
    }
    if (reqText.includes('애니메이션') && !/fade-up|keyframes/i.test(html)) {
      html = html.replace(/<\/head>/i, `<style>@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}section,.card{animation:fadeUp .5s ease both}</style></head>`);
    }

    return res.status(200).json({ html, provider: 'aere-local-fallback' });
  } catch (error) {
    console.error('Generate API 오류:', error?.message || error);
    return res.status(500).json({ error: error?.message || '서버 오류' });
  }
}
