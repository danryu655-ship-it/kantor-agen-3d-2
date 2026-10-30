// Modul posting Meta — tahap 2 (kode saja, token TIDAK ada di repo).
// Token dibaca dari environment variable server SAAT BERJALAN, bukan dari file ini:
//   META_IG_USER_ID, META_IG_TOKEN        (Instagram)
//   META_FB_PAGE_ID, META_FB_PAGE_TOKEN   (Facebook Page)
//   META_THREADS_USER_ID, META_THREADS_TOKEN (Threads)
//   META_APP_ID
// ID default di bawah diambil dari config yang diberikan pengguna 2026-10-31;
// environment variable selalu menang atas nilai default.
//
// ATURAN YANG DIKUNCI DI MODUL INI (tidak bisa dilewati lewat API ini):
//  - hanya konten berstatus 'disetujui' yang boleh diposting
//  - format harus image-only, caption wajib memuat link YouTube Nihongo Santai
//  - platform hanya Instagram / Facebook / Threads (tanpa TikTok)
//  - imageUrl harus URL publik https (API Meta tidak menerima file lokal)
// Fungsi-fungsi di sini TIDAK dipanggil otomatis oleh server tahap 1;
// pemanggilan nyata tetap butuh persetujuan pengguna atas teks & gambar persisnya.
'use strict';

const CONFIG = {
  appId: process.env.META_APP_ID || '1685328012949526',
  instagramUserId: process.env.META_IG_USER_ID || '17841464292133782',
  facebookPageId: process.env.META_FB_PAGE_ID || '122104907499522859',
  threadsUserId: process.env.META_THREADS_USER_ID || '17841464292133782',
};
const YOUTUBE_LINK = 'https://youtube.com/@nihongosantai-v1m';

function validateContent(content) {
  if (!content) throw new Error('konten tidak ditemukan');
  if (content.status !== 'disetujui') throw new Error('konten belum disetujui (status: ' + content.status + '); posting ditolak');
  if (content.format && content.format !== 'image-only') throw new Error('format harus image-only');
  if (!content.caption || !String(content.caption).includes(YOUTUBE_LINK)) throw new Error('caption wajib memuat link YouTube Nihongo Santai');
  if (!content.imageUrl || !String(content.imageUrl).startsWith('https://')) throw new Error('imageUrl harus URL publik https');
  return true;
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('Meta API error ' + res.status + ': ' + JSON.stringify(data.error || data));
  return data;
}

// Instagram: buat media container, lalu publish. Token: META_IG_TOKEN.
async function postToInstagram(content) {
  validateContent(content);
  const token = process.env.META_IG_TOKEN;
  if (!token) throw new Error('META_IG_TOKEN belum diset di server (token tidak disimpan di repo)');
  const container = await postJson(`https://graph.instagram.com/v21.0/${CONFIG.instagramUserId}/media`, {
    image_url: content.imageUrl, caption: content.caption, access_token: token,
  });
  if (!container.id) throw new Error('gagal membuat Instagram media container');
  return postJson(`https://graph.instagram.com/v21.0/${CONFIG.instagramUserId}/media_publish`, {
    creation_id: container.id, access_token: token,
  });
}

// Facebook Page: posting foto ke Page. Token: META_FB_PAGE_TOKEN.
async function postToFacebook(content) {
  validateContent(content);
  const token = process.env.META_FB_PAGE_TOKEN;
  if (!token) throw new Error('META_FB_PAGE_TOKEN belum diset di server (token tidak disimpan di repo)');
  return postJson(`https://graph.facebook.com/v21.0/${CONFIG.facebookPageId}/photos`, {
    url: content.imageUrl, message: content.caption, access_token: token,
  });
}

// Threads: buat container teks+media, lalu publish. Token: META_THREADS_TOKEN.
async function postToThreads(content) {
  validateContent(content);
  const token = process.env.META_THREADS_TOKEN;
  if (!token) throw new Error('META_THREADS_TOKEN belum diset di server (token tidak disimpan di repo)');
  const container = await postJson('https://graph.threads.net/v1.0/me/threads', {
    media_type: 'IMAGE', image_url: content.imageUrl, text: content.caption, access_token: token,
  });
  if (!container.id) throw new Error('gagal membuat Threads container');
  return postJson('https://graph.threads.net/v1.0/me/threads_publish', {
    creation_id: container.id, access_token: token,
  });
}

module.exports = { CONFIG, validateContent, postToInstagram, postToFacebook, postToThreads };
