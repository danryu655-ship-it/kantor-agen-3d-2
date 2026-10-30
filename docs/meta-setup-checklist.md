# Checklist Setup Meta — Kantor Konten Nihongo Santai

Aplikasi Meta: **Kantor Konten Nihongo Santai**
Use cases: Manage messaging and content on Instagram, Manage content on Facebook Pages, Manage Threads content.
Platform yang diizinkan: Instagram @nihongosantai.id95, Facebook Nihongo Santai, Threads @nihongosantai.id95 (tanpa TikTok).
Aturan yang tetap berlaku: konten image-only, caption wajib link YouTube, setiap postingan butuh persetujuan pengguna atas teks & media persisnya.

## Sudah selesai
- [x] Buat aplikasi Meta (nama di atas)
- [x] Tambah 3 use cases

## Berikutnya (urutan)
1. [ ] Di dashboard aplikasi, buka Use Cases > Customize untuk Instagram: tambah permission
   `instagram_business_basic`, `instagram_business_content_publish` (dan `instagram_content_publish` bila diminta).
2. [ ] API setup with Instagram login: hubungkan Instagram @nihongosantai.id95 (akun Profesional, terhubung ke Halaman Facebook Nihongo Santai).
3. [ ] Customize use case Facebook Pages: tambah `pages_read_engagement`, `pages_manage_posts`; hubungkan Halaman Facebook Nihongo Santai.
4. [ ] Customize use case Threads: tambah `threads_basic`, `threads_content_publish`; hubungkan Threads @nihongosantai.id95.
5. [ ] Pastikan kamu (pemilik akun) berstatus Admin di aplikasi — untuk pemakaian akun sendiri, mode Development sudah cukup; App Review baru perlu bila aplikasi dipakai orang lain.
6. [ ] Generate token: Page Access Token (long-lived) untuk Halaman, dan token Instagram/Threads dari API setup masing-masing.
   PENTING: jangan kirim token lewat chat biasa. Token hanya dimasukkan ke server platform lewat jalur aman saat tahap posting otomatis dimulai.
7. [ ] Uji posting: satu postingan draf/uji ke akun sendiri, dengan teks & gambar yang sudah disetujui — bukan posting massal.
8. [ ] Setelah token siap, tahap berikutnya di repo ini: tambah modul posting Meta ke `platform/server.js` (tahap 2) dan deploy server agar jalan 24 jam.

## Status aplikasi
- Mode: Development (cukup untuk akun sendiri)
- Live / App Review: belum perlu, kecuali aplikasi dipakai publik.
