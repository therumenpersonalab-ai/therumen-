// 서버 프록시를 통한 API 호출 — API 키가 클라이언트에 노출되지 않음

export async function callClaude(messages, maxTokens = 16000) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.html;
}

export async function generateDalleImage(prompt, size) {
  const res = await fetch('/api/dalle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.image;
}

export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
