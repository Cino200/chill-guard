'use strict';
/** Halaman pemeriksaan: memastikan server, database, dan folder foto siap (untuk persiapan sebelum demo). */
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../config');
const { satu } = require('../db');
const { formatWib } = require('../lib/waktu');
const { e, kepala, kaki } = require('../lib/tampilan');

function cek(c) {
  const baris = [];
  const tambah = (nama, ok, ket) => baris.push({ nama, ok, ket });
  tambah('Node.js', true, process.version + ' (' + process.platform + ' ' + process.arch + ')');
  try {
    tambah('Database SQLite', true, path.join(config.FOLDER_DATA, 'chillguard.db'));
    const kulkas = satu('SELECT COUNT(*) AS n FROM kulkas').n;
    tambah('Kulkas (harus 17)', kulkas === 17, kulkas + ' kulkas');
    const admin = satu("SELECT COUNT(*) AS n FROM pengguna WHERE role = 'admin'").n;
    tambah('Akun admin', admin >= 1, admin + ' admin');
  } catch (err) { tambah('Database SQLite', false, err.message); }
  try {
    const uji = path.join(config.FOLDER_DATA, 'uploads', '.uji');
    fs.writeFileSync(uji, 'x'); fs.unlinkSync(uji);
    tambah('Folder foto dapat ditulis', true, path.join(config.FOLDER_DATA, 'uploads'));
  } catch (err) { tambah('Folder foto dapat ditulis', false, err.message); }
  tambah('Waktu server (WIB)', true, formatWib(Date.now()) + ' (zona waktu Windows: ' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + ')');
  const ip = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  tambah('Alamat untuk HP/Android', ip.length > 0, ip.length ? ip.map((a) => `http://${a}:${c.port}/`).join('  ') : 'tidak ada jaringan aktif');

  const semuaOk = baris.every((b) => b.ok);
  c.html(kepala(c, 'Cek Sistem') + `<h1>Cek Sistem</h1>
<p class="${semuaOk ? 'pesan pesan-sukses' : 'pesan pesan-galat'}">${semuaOk ? 'SEMUA OK - server siap dipakai.' : 'Ada yang bermasalah, lihat baris merah.'}</p>
<div class="tabel-gulir"><table class="tabel"><thead><tr><th>Pemeriksaan</th><th>Hasil</th><th>Keterangan</th></tr></thead><tbody>
${baris.map((b) => `<tr><td>${e(b.nama)}</td><td>${b.ok ? 'OK' : 'GAGAL'}</td><td>${e(b.ket)}</td></tr>`).join('\n')}
</tbody></table></div>
<p><a href="/">Ke aplikasi</a></p>
` + kaki());
}

module.exports = { cek };
