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
- Posting beneran ke Instagram/Facebook/Threads (butuh aplikasi & izin Meta)
- Agen AI yang benar-benar menulis/membalas (butuh API model AI)
- Status `disetujui` di sini hanya persetujuan di data — BUKAN posting ke sosmed.

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
