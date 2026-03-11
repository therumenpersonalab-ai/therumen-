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
  const cards = readJson(benchPath, []);
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
      const card = {
        site_name: host,
        site_url: url,
        industry_vertical: inferIndustry(text),
        business_mode: inferMode(text),
        key_modules: ['hero', 'category-or-sections', 'cta', 'contact'],
        visual_mood: 'auto-derived',
        analyzed_at: TODAY,
      };
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

  if (added.length > 0) {
    execSync('git add data/benchmark_cards.json data/analyzed_urls.json', { stdio: 'inherit' });
    execSync(`git commit -m "chore: daily imweb analysis (+${added.length} templates)"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
