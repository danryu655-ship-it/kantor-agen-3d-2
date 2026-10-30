# Platform Kantor 3D — Nihongo Santai (tahap 1: kode saja, belum live)

Kode platform untuk Kantor Konten 3D, disimpan di repo ini berdampingan dengan
halaman statis `index.html` (export artifact Muse `kantor-agen-3d-2`, v9).

## Yang sudah ada di tahap 1
- Backend Node.js **tanpa dependensi eksternal** (`platform/server.js`, Node >= 18)
- API: `GET /api/health`, `GET /api/agents`, `GET /api/schedule`,
  `GET/POST/PATCH /api/tasks`, `GET/POST/PATCH /api/contents`
- Data tugas & konten disimpan di `platform/data/db.json` (file lokal, dibuat otomatis saat server pertama jalan)
- Aturan yang sudah ditegakkan di kode: konten format image-only, caption wajib
  memuat link YouTube Nihongo Santai, status konten/tugas harus lewat persetujuan
  (`draft -> siap -> disetujui -> selesai`)

## Yang BELUM ada (tahap berikutnya, bukan di kode ini)
- Login/auth, database server, hosting 24 jam
- Scheduler yang mengeksekusi tugas otomatis
- Agen AI yang benar-benar menulis/membalas (butuh API model AI)
- Status `disetujui` di sini hanya persetujuan di data — BUKAN posting ke sosmed.

## Tahap 2 — modul posting Meta
- `platform/meta-posting.js`: posting IG/FB/Threads, dikunci rule kantor
  (hanya konten `disetujui`, image-only, caption wajib link YouTube).
- Modul ini BELUM disambungkan ke endpoint server dan BELUM menerima token.
  Token HANYA lewat environment variable server saat deploy, JANGAN pernah
  dimasukkan ke repo, file kode, atau chat:
  `META_IG_TOKEN`, `META_FB_PAGE_TOKEN`, `META_THREADS_TOKEN`
  (plus `META_IG_USER_ID`, `META_FB_PAGE_ID`, `META_THREADS_USER_ID`, `META_APP_ID`
  — nilai defaultnya ada di `platform/config.json` bagian `metaIds`/`metaAppId`).

## Deploy (coba)
- **Halaman statis (GitHub Pages):** di repo Settings > Pages > Deploy from a
  branch > main / (root). Situsnya nanti:
  `https://danryu655-ship-it.github.io/kantor-agen-3d-2/`
  Ini hanya halaman 3D-nya, bukan backend.
- **Backend (Docker, mis. Render/Railway/VPS):** build dari `Dockerfile` di root
  repo, set `PORT` dan environment variable token Meta di atas di dashboard
  hosting (bukan di repo). Perintah lokal: `docker build -t kantor . && docker run -p 3000:3000 kantor`
- **Uji coba di VM Muse (bukan publik):** `node platform/server.js` lalu
  `curl http://localhost:3000/api/health` — server ini berhenti saat VM
  diganti/restart, jadi bukan hosting permanen.

## Menjalankan lokal
```bash
node platform/server.js
# buka http://localhost:3000  (halaman 3D)
# cek  http://localhost:3000/api/health
```

## Struktur
```
index.html              # halaman 3D statis (export artifact v9)
platform/
  package.json
  server.js             # backend API + penyaji index.html
  README.md             # file ini
  data/db.json          # dibuat otomatis saat server jalan (tidak ikut commit tahap 1)
```
