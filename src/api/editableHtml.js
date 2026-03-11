// iframe 내 contentEditable 인라인 편집 기능 주입

export function makeEditableHtml(html) {
  const injection = '<style data-lumen-edit>' +
    '[contenteditable]{outline:none;transition:outline 0.15s,background 0.15s}' +
    '[contenteditable]:hover{outline:2px dashed rgba(37,99,235,0.35);outline-offset:3px;cursor:text;border-radius:4px}' +
    '[contenteditable]:focus{outline:2.5px solid #2563EB;outline-offset:3px;background:rgba(37,99,235,0.04);border-radius:4px}' +
    '.le-bar{position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;padding:12px 20px;font-size:13px;font-family:-apple-system,sans-serif;z-index:10000;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(37,99,235,0.25)}' +
    '.le-bar .le-dot{width:8px;height:8px;border-radius:50%;background:#34D399;animation:le-pulse 1.5s infinite}' +
    '@keyframes le-pulse{0%,100%{opacity:1}50%{opacity:0.4}}' +
    '</style>' +
    '<div class="le-bar" data-lumen-edit><div class="le-dot"></div> 편집 모드 — 텍스트를 클릭하면 바로 수정됩니다</div>' +
    '<script data-lumen-edit>' +
    '(function(){' +
    'document.body.style.paddingTop="48px";' +
    'var sels="h1,h2,h3,h4,h5,h6,p,span,li,a,td,th,figcaption,blockquote,dt,dd";' +
    'document.querySelectorAll(sels).forEach(function(el){' +
    'if(el.closest("script,style,[data-lumen-edit],nav"))return;' +
    'if(el.querySelectorAll("h1,h2,h3,h4,h5,h6,p,div,ul,ol").length>2)return;' +
    'el.contentEditable="true";el.spellcheck=false;' +
    '});' +
    'var tm;document.addEventListener("input",function(){' +
    'clearTimeout(tm);tm=setTimeout(function(){' +
    'var c=document.documentElement.cloneNode(true);' +
    'c.querySelectorAll("[contenteditable]").forEach(function(e){e.removeAttribute("contenteditable");e.removeAttribute("spellcheck")});' +
    'c.querySelectorAll("[data-lumen-edit]").forEach(function(e){e.remove()});' +
    'c.querySelector("body").style.paddingTop="";' +
    'window.parent.postMessage({type:"lumen-edit",html:"<!DOCTYPE html><html>"+c.innerHTML+"</html>"},"*");' +
    '},400)});' +
    '})();<\\/script>';
  if (html.includes('</body>')) return html.replace('</body>', injection + '</body>');
  if (html.includes('</html>')) return html.replace('</html>', injection + '</html>');
  return html + injection;
}

export function injectImages(html, images) {
  let r = html;
  if (images.logo) r = r.replaceAll('__LOGO__', images.logo);
  if (images.hero) r = r.replaceAll('__HERO__', images.hero);
  images.products.forEach((img, i) => { r = r.replaceAll('__PRODUCT_' + i + '__', img); });
  return r;
}
