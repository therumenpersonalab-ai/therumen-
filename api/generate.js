function stripCodeFence(s = '') {
  return String(s)
    .replace(/```html\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === 'string') return c;
        if (c?.type === 'text') return c.text || '';
        return '';
      })
      .join('\n');
  }
  return '';
}

function extractHtmlFromRaw(raw = '') {
  const marker1 = raw.match(/===\s*현재 HTML\s*===\s*([\s\S]*)$/i);
  if (marker1) return marker1[1].trim();

  const marker2 = raw.match(/기존 HTML:\s*([\s\S]*?)\n\nHTML만 출력\.?\s*$/i);
  if (marker2) return marker2[1].trim();

  const full = raw.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || raw.match(/<html[\s\S]*<\/html>/i);
  if (full) return full[0].trim();

  return '';
}

function ensureHtmlSkeleton(html = '') {
  if (html && /<html[\s\S]*<\/html>/i.test(html)) return html;
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>루멘 웹빌더</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;background:#f8fafc;color:#0f172a}.container{max-width:980px;margin:0 auto}section{padding:32px 0}.btn{display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#2563eb;color:#fff}</style></head><body><div class="container"><h1>루멘 웹빌더 결과</h1><p>요청이 반영되었습니다.</p></div></body></html>`;
}

function injectBeforeBodyEnd(html, snippet) {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${snippet}</body>`);
  return `${html}${snippet}`;
}

function applyLocalTransform(rawText, htmlInput) {
  let html = ensureHtmlSkeleton(htmlInput);
  const t = String(rawText || '').toLowerCase();

  // 이미지 교체 요청(__NEWIMG__ placeholder)
  if (rawText.includes('__NEWIMG__')) {
    if (/<img[^>]*src=["'][^"']*["'][^>]*>/i.test(html)) {
      html = html.replace(/<img([^>]*?)src=["'][^"']*["']([^>]*)>/i, '<img$1src="__NEWIMG__"$2>');
    } else {
      html = injectBeforeBodyEnd(html, '<img src="__NEWIMG__" alt="image" style="max-width:100%;height:auto;display:block;margin:20px auto;"/>');
    }
    return html;
  }

  // AI 문구 수정: 제목 변경 패턴
  const titleChange = rawText.match(/제목[^\n]*?(["'“”]?)(.+?)\1\s*로\s*변경/i);
  if (titleChange && /<h1[\s\S]*?<\/h1>/i.test(html)) {
    const nextTitle = titleChange[2].trim();
    html = html.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${nextTitle}</h1>`);
  }

  // 소개글 재작성
  if (t.includes('소개글') || t.includes('카피') || t.includes('문구')) {
    html = html.replace(/<p([^>]*)>[\s\S]*?<\/p>/i, '<p$1>고객이 바로 이해하고 신뢰할 수 있도록 핵심 가치를 간결하고 선명하게 전달합니다.</p>');
  }

  // 기능 추가 패턴들
  if (t.includes('faq')) {
    html = injectBeforeBodyEnd(
      html,
      `<section id="faq" style="padding:48px 20px;background:#f8fafc"><div style="max-width:980px;margin:0 auto"><h2>자주 묻는 질문</h2><details><summary>예약은 어떻게 하나요?</summary><p>문의 버튼 또는 연락처로 가능합니다.</p></details><details><summary>운영 시간은?</summary><p>페이지 하단 운영정보에서 확인할 수 있습니다.</p></details></div></section>`
    );
  }

  if (t.includes('카카오')) {
    html = injectBeforeBodyEnd(
      html,
      `<a href="https://pf.kakao.com" style="position:fixed;right:24px;bottom:24px;background:#FEE500;color:#3A1D1D;padding:12px 16px;border-radius:999px;text-decoration:none;font-weight:700;z-index:9999">카카오 상담</a>`
    );
  }

  if (t.includes('구글 지도') || t.includes('오시는 길')) {
    html = injectBeforeBodyEnd(
      html,
      `<section id="map" style="padding:48px 20px"><div style="max-width:980px;margin:0 auto"><h2>오시는 길</h2><div style="height:280px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><iframe title="map" src="https://maps.google.com/maps?q=seoul&z=13&output=embed" width="100%" height="100%" style="border:0"></iframe></div></div></section>`
    );
  }

  if (t.includes('팝업')) {
    html = injectBeforeBodyEnd(
      html,
      `<div id="lumen-popup" style="position:fixed;inset:0;background:rgba(2,6,23,.55);display:flex;align-items:center;justify-content:center;z-index:10000"><div style="background:#fff;border-radius:14px;padding:20px;max-width:360px;width:92%"><h3 style="margin:0 0 8px">이벤트 안내</h3><p style="margin:0 0 12px">지금 신청하면 특별 혜택을 드립니다.</p><button onclick="document.getElementById('lumen-popup').remove()" style="padding:8px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer">닫기</button></div></div>`
    );
  }

  if (t.includes('sns') || t.includes('인스타')) {
    html = injectBeforeBodyEnd(
      html,
      `<section style="padding:48px 20px;background:#f8fafc"><div style="max-width:980px;margin:0 auto"><h2>SNS 피드</h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px"><div style="aspect-ratio:1/1;background:#e2e8f0;border-radius:10px"></div><div style="aspect-ratio:1/1;background:#e2e8f0;border-radius:10px"></div><div style="aspect-ratio:1/1;background:#e2e8f0;border-radius:10px"></div></div></div></section>`
    );
  }

  if (t.includes('예약/문의 폼') || t.includes('문의 폼') || t.includes('예약 폼')) {
    html = injectBeforeBodyEnd(
      html,
      `<section id="contact" style="padding:48px 20px"><div style="max-width:980px;margin:0 auto"><h2>예약/문의</h2><form style="display:grid;gap:10px;max-width:560px"><input placeholder="이름" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px"/><input placeholder="연락처" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px"/><textarea placeholder="문의 내용" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;min-height:120px"></textarea><button type="button" style="padding:10px;border:none;border-radius:8px;background:#2563eb;color:#fff">문의 보내기</button></form></div></section>`
    );
  }

  if (t.includes('애니메이션')) {
    if (!/@keyframes\s+fadeUp/i.test(html)) {
      html = html.replace(/<\/head>/i, '<style>@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}section,.card{animation:fadeUp .45s ease both}</style></head>');
    }
  }

  if (t.includes('컬러') || t.includes('리디자인')) {
    if (!/:root\s*\{/.test(html)) {
      html = html.replace(/<\/head>/i, '<style>:root{--primary:#7c3aed;--secondary:#f5f3ff;--accent:#22d3ee;} .btn{background:var(--primary)!important}</style></head>');
    }
  }

  return html;
}

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
    const last = messages[messages.length - 1];
    const raw = contentToText(last?.content);

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
      let html = stripCodeFence((data.content || []).map((b) => b.text || '').join(''));

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
        const cont = stripCodeFence((contData.content || []).map((b) => b.text || '').join(''));
        html = `${html}\n${cont}`;
      }

      html = applyLocalTransform(raw, html);
      return res.status(200).json({ html, usage: data.usage, provider: 'anthropic' });
    }

    // 2) OpenAI fallback
    if (process.env.OPENAI_API_KEY) {
      const openaiMessages = messages.map((m) => ({ role: m.role, content: contentToText(m.content) }));
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.35,
          messages: openaiMessages,
          max_tokens: Math.min(Number(max_tokens) || 8000, 8000),
        }),
      });
      const data = await openaiRes.json();
      const html = stripCodeFence(String(data?.choices?.[0]?.message?.content || ''));

      if (html) {
        const patched = applyLocalTransform(raw, html);
        return res.status(200).json({ html: patched, usage: data?.usage, provider: 'openai-fallback' });
      }
    }

    // 3) 무키/비정상 응답 fallback: 에이레 로컬 처리 (중단 방지)
    const baseHtml = extractHtmlFromRaw(raw);
    const html = applyLocalTransform(raw, baseHtml);
    return res.status(200).json({ html, provider: 'aere-local-fallback' });
  } catch (error) {
    console.error('Generate API 오류:', error?.message || error);

    // 마지막 보호: 실패해도 기능 중단 방지
    try {
      const messages = req.body?.messages || [];
      const last = messages[messages.length - 1];
      const raw = contentToText(last?.content);
      const baseHtml = extractHtmlFromRaw(raw);
      const html = applyLocalTransform(raw, baseHtml);
      return res.status(200).json({ html, provider: 'aere-local-fallback-catch' });
    } catch (_) {
      return res.status(500).json({ error: error?.message || '서버 오류' });
    }
  }
}
