'use strict';
/**
 * Chill Guard - server web portable (Node.js, tanpa instalasi, tanpa server database terpisah).
 * Jalankan lewat start.bat (Windows) atau:  node server.js
 */
const [versiMayor, versiMinor] = process.versions.node.split('.').map(Number);
if (versiMayor < 22 || (versiMayor === 22 && versiMinor < 13)) {
  console.error('Node.js ' + process.version + ' terlalu lama. Chill Guard butuh Node.js 22.13 atau lebih baru.');
  console.error('Pakai node\\node.exe bawaan paket ini (start.bat memakainya otomatis).');
  process.exit(1);
}
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const busboy = require('busboy');
const config = require('./config');
const dbm = require('./db');
const T = require('./lib/tampilan');

const PUBLIK = path.join(__dirname, 'public');
const MIME = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// ------------------------------------------------------------------ sesi (di memori)
const sesiMap = new Map();    // sid -> {data, aktif}
function bersihkanSesi() {
  const batas = Date.now() - config.SESI_TIMEOUT_MS;
  for (const [id, s] of sesiMap) if (s.aktif < batas) sesiMap.delete(id);
}
setInterval(bersihkanSesi, 5 * 60 * 1000).unref();

function bacaCookie(req, nama) {
  for (const bagian of String(req.headers.cookie || '').split(';')) {
    const [k, ...v] = bagian.trim().split('=');
    if (k === nama) return v.join('=');
  }
  return null;
}
const sidBaru = () => crypto.randomBytes(32).toString('hex');

// ------------------------------------------------------------------ konteks permintaan
class Konteks {
  constructor(req, res, port) {
    this.req = req; this.res = res; this.port = port;
    this.method = req.method;
    const url = new URL(req.url, 'http://x');
    this.path = decodeURIComponent(url.pathname);
    this.query = Object.fromEntries(url.searchParams);
    this.body = {}; this.files = {};
    this.cookiesBaru = [];
    this.sid = null; this.sesi = null;
  }

  mulaiSesi() {
    const sekarang = Date.now();
    let sid = bacaCookie(this.req, 'CHILLGUARDSESI');
    let s = sid ? sesiMap.get(sid) : null;
    let pesanAwal = null;
    // Sesi habis setelah 30 menit tidak aktif
    if (s && sekarang - s.aktif > config.SESI_TIMEOUT_MS) {
      sesiMap.delete(sid); s = null;
      pesanAwal = { jenis: 'info', pesan: 'Sesi berakhir karena tidak aktif. Silakan masuk kembali.' };
    }
    if (!s) {
      sid = sidBaru();
      s = { data: {}, aktif: sekarang };
      if (pesanAwal) s.data.flash = pesanAwal;
      sesiMap.set(sid, s);
      this.setCookieSesi(sid);
    }
    s.aktif = sekarang;
    this.sid = sid; this.sesi = s;

    // Pastikan akun di sesi masih ada (bisa dihapus Admin) dan ambil peran terbaru
    if (s.data.pengguna) {
      const akun = dbm.satu('SELECT id, nama, email, role FROM pengguna WHERE id = ?', s.data.pengguna.id);
      if (!akun) {
        s.data = { flash: { jenis: 'info', pesan: 'Akun tidak ditemukan. Silakan masuk kembali.' } };
      } else {
        s.data.pengguna = { id: akun.id, nama: akun.nama, email: akun.email, role: akun.role };
      }
    }
  }

  setCookieSesi(sid) {
    this.cookiesBaru.push(`CHILLGUARDSESI=${sid}; Path=/; HttpOnly; SameSite=Lax`);
  }
  /** Ganti ID sesi (mencegah session fixation) dengan data baru. */
  rotasi(dataBaru) {
    sesiMap.delete(this.sid);
    this.sid = sidBaru();
    this.sesi = { data: dataBaru, aktif: Date.now() };
    sesiMap.set(this.sid, this.sesi);
    this.setCookieSesi(this.sid);
  }

  get pengguna() { return this.sesi ? this.sesi.data.pengguna ?? null : null; }
  masukkan(akun) { this.rotasi({ pengguna: akun }); }
  keluarkan() { this.rotasi({}); }

  setFlash(jenis, pesan) { this.sesi.data.flash = { jenis, pesan }; }
  ambilFlash() { const f = this.sesi.data.flash ?? null; delete this.sesi.data.flash; return f; }

  csrfToken() {
    if (!this.sesi.data.csrf) this.sesi.data.csrf = crypto.randomBytes(32).toString('hex');
    return this.sesi.data.csrf;
  }
  /** Menghentikan permintaan POST bila token tidak cocok. */
  cekCsrf() {
    const kirim = Buffer.from(String(this.body._csrf ?? ''));
    const asli = Buffer.from(this.csrfToken());
    if (kirim.length === asli.length && crypto.timingSafeEqual(kirim, asli)) return true;
    this.kirim('Permintaan tidak valid (token keamanan salah). Muat ulang halaman dan coba lagi.', 'text/plain; charset=utf-8', {}, 400);
    return false;
  }

  // ---- hak akses
  wajibLogin() {
    if (this.pengguna) return this.pengguna;
    this.redirect('/masuk');
    return null;
  }
  wajibAdmin() {
    const p = this.wajibLogin();
    if (!p) return null;
    if (p.role !== 'admin') {
      this.html('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        + '<body style="font-family:system-ui,sans-serif;padding:2rem"><h1>403 - Akses ditolak</h1>'
        + '<p>Halaman ini hanya untuk Admin.</p><p><a href="/">Kembali</a></p></body>', 403);
      return null;
    }
    return p;
  }
  wajibPegawai() {
    const p = this.wajibLogin();
    if (!p) return null;
    if (p.role === 'admin') { this.redirect('/admin'); return null; }
    return p;
  }

  // ---- respons
  kirim(isi, tipe, header = {}, status = 200) {
    if (this.res.headersSent) return;
    const buf = Buffer.isBuffer(isi) ? isi : Buffer.from(String(isi));
    const h = {
      'Content-Type': tipe, 'Content-Length': buf.length, 'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN', 'Cache-Control': 'no-store', ...header,
    };
    if (this.cookiesBaru.length) h['Set-Cookie'] = this.cookiesBaru;
    this.res.writeHead(status, h);
    this.res.end(buf);
  }
  html(isi, status = 200) { this.kirim(isi, 'text/html; charset=utf-8', {}, status); }
  json(obj, status = 200) { this.kirim(JSON.stringify(obj), 'application/json; charset=utf-8', {}, status); }
  redirect(tujuan) { this.kirim('', 'text/plain; charset=utf-8', { Location: tujuan }, 302); }
}

// ------------------------------------------------------------------ membaca isi permintaan
const BATAS_BODY = 4 * 1024 * 1024;

function bacaBody(req) {
  return new Promise((resolve, reject) => {
    const tipe = String(req.headers['content-type'] || '');
    const hasil = { body: {}, files: {} };
    if (/^multipart\/form-data/i.test(tipe)) {
      const bb = busboy({ headers: req.headers, limits: { fileSize: config.FOTO_MAKS_BYTE + 1, files: 3, fields: 40, fieldSize: 20000 } });
      bb.on('field', (nama, nilai) => { hasil.body[nama] = nilai; });
      bb.on('file', (nama, aliran, info) => {
        const bagian = [];
        let terpotong = false;
        aliran.on('data', (d) => bagian.push(d));
        aliran.on('limit', () => { terpotong = true; });
        aliran.on('end', () => {
          hasil.files[nama] = { nama: info.filename || '', buffer: Buffer.concat(bagian), terpotong };
        });
      });
      bb.on('close', () => resolve(hasil));
      bb.on('error', reject);
      req.pipe(bb);
      return;
    }
    const potong = [];
    let total = 0;
    req.on('data', (d) => {
      total += d.length;
      if (total > BATAS_BODY) { reject(new Error('Permintaan terlalu besar')); req.destroy(); return; }
      potong.push(d);
    });
    req.on('end', () => {
      const teks = Buffer.concat(potong).toString('utf8');
      if (/^application\/x-www-form-urlencoded/i.test(tipe)) hasil.body = Object.fromEntries(new URLSearchParams(teks));
      resolve(hasil);
    });
    req.on('error', reject);
  });
}

// ------------------------------------------------------------------ rute
const auth = require('./pages/auth');
const makanan = require('./pages/makanan');
const pegawai = require('./pages/pegawai');
const admin = require('./pages/admin');
const cek = require('./pages/cek');

const RUTE = {
  '/masuk': auth.masuk, '/daftar': auth.daftar, '/keluar': auth.keluar,
  '/dashboard': makanan.dashboard, '/makanan/tambah': makanan.tambah, '/makanan/ubah': makanan.ubah, '/makanan/aksi': makanan.aksi,
  '/profil': pegawai.profil, '/notifikasi': pegawai.notifikasi, '/chat': pegawai.chat,
  '/admin': admin.pantau, '/admin/alarm': admin.alarm, '/admin/sampah': admin.sampah,
  '/admin/pengguna': admin.pengguna, '/admin/laporan': admin.laporan,
  '/cek': cek.cek,
};

function sajikanBerkas(c, berkas, tipe) {
  fs.readFile(berkas, (err, isi) => {
    if (err) return c.kirim('404 - Tidak ditemukan', 'text/plain; charset=utf-8', {}, 404);
    c.kirim(isi, tipe, { 'Cache-Control': 'public, max-age=300' });
  });
}

async function tangani(req, res, port) {
  const c = new Konteks(req, res, port);
  try {
    // Berkas statis (CSS/JS) dan foto unggahan (hanya nama acak buatan sistem)
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (c.path.startsWith('/css/') || c.path.startsWith('/js/')) {
        const berkas = path.join(PUBLIK, path.normalize(c.path));
        if (!berkas.startsWith(PUBLIK + path.sep)) return c.kirim('403', 'text/plain', {}, 403);
        return sajikanBerkas(c, berkas, MIME[path.extname(berkas)] || 'application/octet-stream');
      }
      const mf = /^\/uploads\/([a-f0-9]{32}\.(jpg|png))$/.exec(c.path);
      if (mf) return sajikanBerkas(c, path.join(config.FOLDER_DATA, 'uploads', mf[1]), MIME['.' + mf[2]]);
      if (c.path === '/favicon.ico') return c.kirim('', 'image/x-icon', {}, 204);
    }

    if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'HEAD') {
      return c.kirim('Metode tidak didukung', 'text/plain; charset=utf-8', {}, 405);
    }
    if (req.method === 'POST') {
      const hasil = await bacaBody(req);
      c.body = hasil.body; c.files = hasil.files;
    }
    c.mulaiSesi();

    if (c.path === '/' || c.path === '/index') {
      return c.redirect(c.pengguna ? T.beranda(c.pengguna) : '/masuk');
    }
    const penangan = RUTE[c.path.replace(/\/+$/, '') || '/'];
    if (!penangan) {
      return c.html(T.kepala(c, 'Tidak ditemukan') + '<h1>404 - Halaman tidak ditemukan</h1><p><a href="/">Kembali</a></p>' + T.kaki(), 404);
    }
    await penangan(c);
  } catch (err) {
    console.error('[GALAT]', req.method, req.url, err && err.stack ? err.stack : err);
    if (!res.headersSent) {
      c.cookiesBaru = [];
      c.kirim('<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:2rem"><h1>500 - Terjadi kesalahan</h1><p>Lihat jendela server untuk rincian.</p><p><a href="/">Kembali</a></p></body>',
        'text/html; charset=utf-8', {}, 500);
    }
  }
}

// ------------------------------------------------------------------ menjalankan server
function alamatJaringan() {
  return Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
}

function bukaBrowser(url) {
  if (process.env.CG_TANPA_BROWSER) return;
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '""', url], { stdio: 'ignore', detached: true }).unref();
    else if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    else spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  } catch { /* tidak masalah, buka manual */ }
}

function mulai(portAwal, percobaan = 0) {
  const server = http.createServer((req, res) => { tangani(req, res, server.address().port); });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && percobaan < 20) {
      console.log(`Port ${portAwal} dipakai program lain, mencoba ${portAwal + 1} ...`);
      return mulai(portAwal + 1, percobaan + 1);
    }
    console.error('Server gagal dimulai:', err.message);
    process.exit(1);
  });
  server.listen(portAwal, '0.0.0.0', () => {
    const port = server.address().port;
    const url = `http://localhost:${port}/`;
    console.log('');
    console.log('==================================================');
    console.log('  CHILL GUARD BERJALAN');
    console.log('==================================================');
    console.log('  Di komputer ini : ' + url);
    for (const ip of alamatJaringan()) console.log(`  Dari HP (Wi-Fi) : http://${ip}:${port}/`);
    console.log('  Data tersimpan  : ' + config.FOLDER_DATA);
    console.log('');
    console.log('  Login admin     : admin@chillguard.local / admin123');
    console.log('  Login pegawai   : rudy@chillguard.local / pegawai123');
    console.log('');
    console.log('  Tutup jendela ini (atau tekan Ctrl+C) untuk berhenti.');
    console.log('==================================================');
    bukaBrowser(url);
  });
  return server;
}

if (require.main === module) {
  dbm.db();   // buat database dan data contoh bila belum ada
  mulai(config.PORT_AWAL);
  const berhenti = () => { dbm.tutup(); process.exit(0); };
  process.on('SIGINT', berhenti);
  process.on('SIGTERM', berhenti);
}

module.exports = { mulai, tangani };
