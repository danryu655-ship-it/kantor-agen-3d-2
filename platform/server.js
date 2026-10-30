// Kantor Konten 3D — Nihongo Santai
// Platform tahap 1: backend API saja (TANPA dependensi eksternal, Node >= 18).
// Yang sudah bisa: daftar agen, agenda harian, CRUD tugas & konten (draft -> siap -> disetujui -> selesai).
// Yang BELUM ada (sengaja, tahap berikutnya):
//  - login/auth, scheduler yang mengeksekusi otomatis, dan posting beneran ke Instagram/Facebook/Threads.
//  - Status "disetujui" di sini HANYA persetujuan di data, bukan posting ke sosmed.
//  - Data disimpan di file JSON lokal (platform/data/db.json), bukan database server.
//
// Menjalankan (dari root repo hasil clone):
//   node platform/server.js
// Lalu buka http://localhost:3000  (halaman 3D statis) dan http://localhost:3000/api/health
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

// Agen & jadwal kantor (WIB) — sesuai desain closingan v9 artifact kantor-agen-3d-2.
const AGENTS = [
  { id: 'agen-1', nama: 'Agen 1 Produksi', tugas: 'Produksi konten', jadwal: 'Senin/Rabu/Sabtu 15.00 WIB' },
  { id: 'agen-2', nama: 'Agen 2 Upload Konten', tugas: 'Upload konten utama', jadwal: 'Setiap hari 20.00 WIB', platform: ['Instagram @nihongosantai.id95', 'Facebook Nihongo Santai', 'Threads @nihongosantai.id95'] },
  { id: 'agen-3', nama: 'Agen 3 Produksi Makanan', tugas: 'Produksi konten makanan khas Jepang', jadwal: 'Selasa/Kamis/Minggu (produksi)' },
  { id: 'agen-4', nama: 'Agen 4 Upload Makanan', tugas: 'Upload konten makanan', jadwal: 'Selasa/Kamis/Minggu 17.00 WIB' },
  { id: 'agen-5', nama: 'Agen 5 Shorts', tugas: 'Shorts', jadwal: 'Setiap hari (tayang di slot 20.00 WIB)' },
  { id: 'agen-6', nama: 'Agen 6 Balas Komentar', tugas: 'Balas komentar (trigger-only, draf dulu, kirim setelah disetujui)', jadwal: 'Setiap hari 10.00 WIB, kondisional' },
  { id: 'agen-7', nama: 'Agen 7 Promosi', tugas: 'Promosi akun (IG/FB/Threads saja, tanpa TikTok)', jadwal: 'Setiap hari' },
  { id: 'agen-8', nama: 'Agen 8 Manager', tugas: 'Manajer, aktivitas terakhir', jadwal: 'Setiap hari 22.30 WIB' },
];

function defaultDb() {
  return {
    tasks: [
      { id: 'task-1', agenId: 'agen-2', judul: 'Upload konten utama harian', status: 'siap', tanggal: null },
      { id: 'task-2', agenId: 'agen-4', judul: 'Upload konten makanan (Selasa/Kamis/Minggu)', status: 'siap', tanggal: null },
    ],
    contents: [],
  };
}

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    const db = defaultDb();
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    return db;
  }
}
function saveDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const VALID_TASK_STATUS = ['draft', 'siap', 'disetujui', 'selesai', 'ditolak'];
const VALID_CONTENT_STATUS = ['draft', 'siap', 'disetujui', 'selesai', 'ditolak'];

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => { buf += c; if (buf.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!buf) return resolve({});
      try { resolve(JSON.parse(buf)); } catch { reject(new Error('JSON tidak valid')); }
    });
    req.on('error', reject);
  });
}
function todayAgenda() {
  // Agenda harian sederhana (WIB, hari dalam Bahasa Indonesia).
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const hari = days[now.getDay()];
  const agenda = [
    { jam: '10.00', agen: 'Agen 6 Balas Komentar', kegiatan: 'Cek & draf balasan komentar (kondisional)' },
    { jam: '12.00-13.00', agen: '-', kegiatan: 'Istirahat siang (tanpa aktivitas)' },
  ];
  if (['Selasa', 'Kamis', 'Minggu'].includes(hari)) agenda.push({ jam: '17.00', agen: 'Agen 4 Upload Makanan', kegiatan: 'Upload konten makanan' });
  agenda.push({ jam: '20.00', agen: 'Agen 2 Upload Konten', kegiatan: 'Upload konten utama (IG/FB/Threads)' });
  if (['Selasa', 'Kamis', 'Minggu'].includes(hari)) agenda.push({ jam: '21.00', agen: 'Divisi Upload Konten', kegiatan: 'Upload kuis' });
  agenda.push({ jam: '22.30', agen: 'Agen 8 Manager', kegiatan: 'Aktivitas terakhir' });
  agenda.push({ jam: '23.00-07.00', agen: '-', kegiatan: 'Istirahat malam (tanpa aktivitas)' });
  return { hari, tanggal: now.toISOString().slice(0, 10), agenda };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  try {
    if (p === '/api/health' && req.method === 'GET') return sendJson(res, 200, { ok: true, service: 'kantor-agen-3d-platform', version: '0.1.0' });
    if (p === '/api/agents' && req.method === 'GET') return sendJson(res, 200, AGENTS);
    if (p === '/api/schedule' && req.method === 'GET') return sendJson(res, 200, todayAgenda());

    if (p === '/api/tasks' && req.method === 'GET') return sendJson(res, 200, loadDb().tasks);
    if (p === '/api/tasks' && req.method === 'POST') {
      const b = await readBody(req);
      if (!b.judul || !b.agenId) return sendJson(res, 400, { error: 'judul dan agenId wajib' });
      const db = loadDb();
      const t = { id: 'task-' + Date.now(), agenId: b.agenId, judul: b.judul, status: 'draft', tanggal: b.tanggal || null };
      db.tasks.push(t); saveDb(db); return sendJson(res, 201, t);
    }
    const taskMatch = p.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch && req.method === 'PATCH') {
      const b = await readBody(req);
      if (b.status && !VALID_TASK_STATUS.includes(b.status)) return sendJson(res, 400, { error: 'status tidak valid' });
      const db = loadDb();
      const t = db.tasks.find((x) => x.id === taskMatch[1]);
      if (!t) return sendJson(res, 404, { error: 'tugas tidak ditemukan' });
      Object.assign(t, b); saveDb(db); return sendJson(res, 200, t);
    }

    if (p === '/api/contents' && req.method === 'GET') return sendJson(res, 200, loadDb().contents);
    if (p === '/api/contents' && req.method === 'POST') {
      const b = await readBody(req);
      if (!b.judul || !b.caption) return sendJson(res, 400, { error: 'judul dan caption wajib' });
      // Aturan caption Nihongo Santai: wajib ada link YouTube (dicek di sini, bukan dipaksa posting).
      if (!String(b.caption).includes('youtube.com/@nihongosantai-v1m')) {
        return sendJson(res, 400, { error: 'caption wajib memuat link YouTube https://youtube.com/@nihongosantai-v1m' });
      }
      const db = loadDb();
      const c = { id: 'content-' + Date.now(), judul: b.judul, caption: b.caption, format: 'image-only', platform: b.platform || ['Instagram', 'Facebook', 'Threads'], status: 'draft' };
      db.contents.push(c); saveDb(db); return sendJson(res, 201, c);
    }
    const contentMatch = p.match(/^\/api\/contents\/([^/]+)$/);
    if (contentMatch && req.method === 'PATCH') {
      const b = await readBody(req);
      if (b.status && !VALID_CONTENT_STATUS.includes(b.status)) return sendJson(res, 400, { error: 'status tidak valid' });
      const db = loadDb();
      const c = db.contents.find((x) => x.id === contentMatch[1]);
      if (!c) return sendJson(res, 404, { error: 'konten tidak ditemukan' });
      Object.assign(c, b); saveDb(db); return sendJson(res, 200, c);
    }

    // Halaman utama: file 3D statis di root repo (index.html hasil export artifact).
    if (p === '/' || p === '/index.html') {
      const file = path.join(ROOT, 'index.html');
      if (!fs.existsSync(file)) return sendJson(res, 404, { error: 'index.html belum ada di root repo' });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(file));
    }
    return sendJson(res, 404, { error: 'rute tidak ditemukan' });
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }
});

server.listen(PORT, () => console.log('Kantor 3D platform tahap 1 jalan di http://localhost:' + PORT));
