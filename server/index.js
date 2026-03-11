import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import generateRoute from './routes/generate.js';
import dalleRoute from './routes/dalle.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

// API 라우트
app.use('/api/generate', generateRoute);
app.use('/api/dalle', dalleRoute);

// 헬스체크
app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '0.5.2' }));

// 프로덕션: 빌드된 프론트엔드 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '..', 'dist')));
  app.get('*', (_, res) => res.sendFile(join(__dirname, '..', 'dist', 'index.html')));
}

app.listen(PORT, () => {
  console.log(`🚀 루멘 웹 빌더 서버: http://localhost:${PORT}`);
  console.log(`   Claude API: ${process.env.ANTHROPIC_API_KEY ? '✅ 연결됨' : '❌ 키 없음'}`);
  console.log(`   OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ 연결됨' : '⚠️ 선택사항'}`);
});
