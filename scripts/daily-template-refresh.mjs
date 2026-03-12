#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const analyzedPath = path.join(DATA_DIR, 'analyzed_urls.json');
const benchPath = path.join(DATA_DIR, 'benchmark_cards.json');

const BEST_URL = 'https://imweb.me/best_production_list';
const TODAY = new Date().toISOString();

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function inferMode(text = '') {
  if (/장바구니|SHOP|상품|구매|SALE|STORE/i.test(text)) return '판매형';
  if (/PROJECT|Portfolio|시공사례|WORK/i.test(text)) return '포트폴리오형';
  if (/Reservation|예약|Rooms|객실/i.test(text)) return '예약형';
  if (/Archive|News|Blog|Subscribe|아카이브/i.test(text)) return '콘텐츠형';
  if (/Community|Q&A|공지|Notice|Board/i.test(text)) return '커뮤니티형';
  if (/Event|Conference|Program|Ticket|행사/i.test(text)) return '행사/프로모션형';
  return '소개/문의형';
}

function inferIndustry(text = '') {
  if (/건축|인테리어|Architecture|Interior/i.test(text)) return '인테리어/건축';
  if (/패션|Fashion|잡화|쇼룸/i.test(text)) return '패션/잡화';
  if (/뷰티|미용|Beauty/i.test(text)) return '뷰티';
  if (/병원|의료|Clinic|Care/i.test(text)) return '병원/케어';
  if (/카페|음식|푸드|Restaurant/i.test(text)) return '음식점/카페';
  if (/IT|Software|Tech|가전/i.test(text)) return 'IT/가전';
  if (/교육|컨설팅|Academy|Consulting/i.test(text)) return '교육/컨설팅';
  if (/여행|숙박|Travel|Hotel/i.test(text)) return '숙박/여행';
  if (/동물|펫|Pet|식물/i.test(text)) return '동물/식물';
  return '기업/비즈니스';
}

function mapToLumenIndustry(text = '') {
  if (/카페|음식|푸드|베이커리|restaurant|cafe/i.test(text)) return '음식/카페';
  if (/뷰티|미용|헤어|네일|beauty|salon/i.test(text)) return '뷰티/미용';
  if (/병원|의료|헬스|health|clinic|care|fitness/i.test(text)) return '의료/헬스';
  if (/학원|교육|수학|영어|입시|academy|education|consulting/i.test(text)) return '교육/학원';
  if (/software|saas|it|tech|개발|플랫폼|가전/i.test(text)) return 'IT/소프트웨어';
  if (/manufacturing|factory|제조|생산|부품|공정/i.test(text)) return '제조/생산';
  if (/law|legal|tax|세무|법무|노무|컨설팅|consulting/i.test(text)) return '법무/세무/컨설팅';
  if (/shop|store|상품|구매|마켓|브랜드|패션|잡화|d2c|e-?commerce/i.test(text)) return '쇼핑/이커머스';
  if (/부동산|real estate|분양|매매|임대/i.test(text)) return '부동산';
  if (/travel|hotel|숙박|리조트|투어|여행/i.test(text)) return '여행/숙박';
  if (/pet|동물|식물|반려/i.test(text)) return '반려동물';
  return '기타';
}

function normalizeCardForLumen(card) {
  const hint = `${card.site_name || ''} ${card.industry_vertical || ''} ${card.business_mode || ''} ${card.visual_mood || ''}`;
  return {
    ...card,
    lumen_industry: card.lumen_industry || mapToLumenIndustry(hint),
  };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 OpenClaw bot' } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return await res.text();
}

function extractImwebLinks(html = '') {
  const out = new Set();
  const re = /https:\/\/[a-zA-Z0-9-]+\.imweb\.me\/?/g;
  let m;
  while ((m = re.exec(html))) out.add(m[0].replace(/\/$/, '') + '/');
  return [...out];
}

async function run() {
  const analyzed = readJson(analyzedPath, { analyzed: [], lastRun: null, logs: [] });
  const cards = readJson(benchPath, []).map(normalizeCardForLumen);
  const already = new Set(analyzed.analyzed);

  const listHtml = await fetchText(BEST_URL);
  const candidates = extractImwebLinks(listHtml);

  const targets = candidates.filter((u) => !already.has(u)).slice(0, 20);
  const added = [];

  for (const url of targets) {
    try {
      const html = await fetchText(url);
      const host = new URL(url).hostname.replace('.imweb.me', '');
      const text = html.replace(/<[^>]+>/g, ' ').slice(0, 40000);
      const card = normalizeCardForLumen({
        site_name: host,
        site_url: url,
        industry_vertical: inferIndustry(text),
        business_mode: inferMode(text),
        key_modules: ['hero', 'category-or-sections', 'cta', 'contact'],
        visual_mood: 'auto-derived',
        analyzed_at: TODAY,
      });
      cards.push(card);
      analyzed.analyzed.push(url);
      added.push(url);
    } catch (e) {
      analyzed.logs.push({ at: TODAY, url, error: String(e.message || e) });
    }
  }

  analyzed.lastRun = TODAY;
  analyzed.logs.push({ at: TODAY, processed: targets.length, added: added.length });
  analyzed.logs = analyzed.logs.slice(-200);

  writeJson(benchPath, cards);
  writeJson(analyzedPath, analyzed);

  const changed = execSync('git status --porcelain data/benchmark_cards.json data/analyzed_urls.json', { encoding: 'utf8' }).trim();
  if (changed) {
    execSync('git add data/benchmark_cards.json data/analyzed_urls.json', { stdio: 'inherit' });
    const msg = added.length > 0
      ? `chore: daily imweb analysis (+${added.length} templates)`
      : 'chore: normalize benchmark cards for industry auto-mapping';
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
