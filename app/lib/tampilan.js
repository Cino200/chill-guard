'use strict';
/** Fungsi tampilan: escape HTML, kerangka halaman, lencana status, kartu makanan, formulir. */
const notifikasi = require('../controllers/notifikasi');
const chat = require('../controllers/chat');

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function e(teks) {
  return String(teks ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

/** "2026-11-15 14:30:00" -> "15 Nov 2026, 14:30" */
function formatTanggal(teks) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(teks));
  if (!m) return String(teks);
  return `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}, ${m[4]}:${m[5]}`;
}

const LABEL = { aman: 'Aman', mendekati: 'Mendekati', kadaluarsa: 'Kadaluarsa' };
const labelStatus = (s) => LABEL[s] ?? s;
const lencanaStatus = (s) => `<span class="lencana lencana-${e(s)}">${e(labelStatus(s))}</span>`;
const csrfField = (c) => `<input type="hidden" name="_csrf" value="${e(c.csrfToken())}">`;
const beranda = (pengguna) => (pengguna && pengguna.role === 'admin' ? '/admin' : '/dashboard');

/** Kepala halaman + navigasi. menuAktif: kunci menu yang ditandai. */
function kepala(c, judul, menuAktif = '') {
  const p = c.pengguna;
  const flash = c.ambilFlash();
  let menu = [];
  if (p) {
    const chatBaru = chat.jumlahBelumDibaca(p.id);
    const teksChat = 'Chat' + (chatBaru > 0 ? ` (${chatBaru})` : '');
    if (p.role === 'admin') {
      menu = [['admin', '/admin', 'Pantau'], ['admin_pengguna', '/admin/pengguna', 'Pengguna'],
        ['admin_sampah', '/admin/sampah', 'Recycle Bin'], ['admin_laporan', '/admin/laporan', 'Laporan'],
        ['chat', '/chat', teksChat]];
    } else {
      const baru = notifikasi.jumlahBelumDibaca(p.id);
      menu = [['dashboard', '/dashboard', 'Makanan Saya'], ['makanan_tambah', '/makanan/tambah', 'Tambah'],
        ['notifikasi', '/notifikasi', 'Notifikasi' + (baru > 0 ? ` (${baru})` : '')],
        ['chat', '/chat', teksChat], ['profil', '/profil', 'Profil']];
    }
  }
  let h = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(judul)} - Chill Guard</title>
<link rel="stylesheet" href="/css/app.css">
</head>
<body>
<header class="bar">
  <a class="merek" href="${e(beranda(p))}"><span class="merek-ikon">&#10052;</span> Chill Guard</a>
`;
  if (p) {
    h += `  <button class="menu-tombol" type="button" aria-label="Menu" onclick="document.body.classList.toggle('menu-buka')">&#9776;</button>
  <nav class="menu">
`;
    for (const [kunci, url, teks] of menu) h += `    <a href="${e(url)}"${kunci === menuAktif ? ' class="aktif"' : ''}>${e(teks)}</a>\n`;
    h += `    <span class="pengguna">${e(p.nama)} <small>(${e(p.role)})</small></span>
    <a href="/keluar" class="keluar">Keluar</a>
  </nav>
`;
  }
  h += `</header>
<main class="isi">
`;
  if (flash) h += `  <div class="pesan pesan-${e(flash.jenis)}" role="status">${e(flash.pesan)}</div>\n`;
  return h;
}

function kaki() {
  return `</main>
<footer class="kaki">Chill Guard &middot; DJPK &middot; Rekayasa Perangkat Lunak UNINDRA 2026</footer>
<script src="/js/app.js"></script>
</body>
</html>
`;
}

const galatHtml = (galat) => (galat ? `  <div class="pesan pesan-galat" role="alert">${e(galat)}</div>\n` : '');

/** Kartu satu makanan. opsi: {tampilPemilik, tampilAdmin, kembali} */
function kartuMakanan(c, m, { tampilPemilik = false, tampilAdmin = false, kembali = '/dashboard' } = {}) {
  return `<article class="kartu makanan status-${e(m.status)}">
${m.foto ? `  <img class="foto" src="/uploads/${e(m.foto)}" alt="Foto ${e(m.nama_makanan)}" loading="lazy">\n` : ''}  <div class="makanan-isi">
    <div class="makanan-atas">
      <h3>${e(m.nama_makanan)}</h3>
      ${lencanaStatus(m.status)}
    </div>
    <p class="sisa">${e(m.teks_sisa)}</p>
    <p class="meta">Kadaluarsa: ${e(formatTanggal(m.tanggal_kadaluarsa))}</p>
    <p class="meta">Lokasi: ${e(m.nama_kulkas)}</p>
${tampilPemilik ? `    <p class="meta">Pemilik: ${e(m.nama_pemilik)}</p>\n` : ''}${m.deskripsi ? `    <p class="meta">${e(m.deskripsi)}</p>\n` : ''}${m.barcode ? `    <p class="meta">Barcode: ${e(m.barcode)}</p>\n` : ''}    <div class="aksi">
${tampilAdmin ? `      <a class="tombol tombol-kecil" href="/admin/alarm?makanan=${m.id}">Kirim alarm</a>\n` : ''}      <a class="tombol tombol-kecil" href="/makanan/ubah?id=${m.id}">Ubah</a>
      <form method="post" action="/makanan/aksi" class="sebaris">
        ${csrfField(c)}
        <input type="hidden" name="id" value="${m.id}">
        <input type="hidden" name="kembali" value="${e(kembali)}">
        <button name="aksi" value="selesai" class="tombol tombol-kecil" data-konfirmasi="Tandai &quot;${e(m.nama_makanan)}&quot; sudah diambil/dikonsumsi?">Selesai</button>
        <button name="aksi" value="hapus" class="tombol tombol-kecil tombol-bahaya" data-konfirmasi="Hapus &quot;${e(m.nama_makanan)}&quot;? Data masuk Recycle Bin.">Hapus</button>
      </form>
    </div>
  </div>
</article>
`;
}

/** Formulir tambah/ubah makanan. */
function formMakanan(c, nilai, kulkas, judulTombol, fotoSekarang = null) {
  const opsi = kulkas.map((k) =>
    `    <option value="${k.id}"${Number(nilai.kulkas_id) === k.id ? ' selected' : ''}>${e(k.keterangan)}</option>`).join('\n');
  return `<form method="post" enctype="multipart/form-data" class="form-lebar">
  ${csrfField(c)}
  <label for="namaMakanan">Nama makanan *</label>
  <input type="text" id="namaMakanan" name="nama_makanan" value="${e(nilai.nama_makanan)}" maxlength="100" required>

  <label for="kulkas_id">Lantai / kulkas *</label>
  <select id="kulkas_id" name="kulkas_id" required>
    <option value="">-- pilih --</option>
${opsi}
  </select>

  <label for="tanggal_kadaluarsa">Tanggal dan jam kadaluarsa *</label>
  <input type="datetime-local" id="tanggal_kadaluarsa" name="tanggal_kadaluarsa" value="${e(nilai.tanggal_kadaluarsa)}" required>

  <label for="barcode">Barcode (opsional)</label>
  <div class="baris-input">
    <input type="text" id="barcode" name="barcode" value="${e(nilai.barcode)}" maxlength="64" inputmode="numeric">
    <button type="button" id="tombolScan" class="tombol">Scan</button>
  </div>
  <p class="bantuan" id="infoScan">Scan memakai kamera tersedia di aplikasi Android. Di browser, ketik kode barcode secara manual.</p>

  <label for="deskripsi">Deskripsi (opsional)</label>
  <textarea id="deskripsi" name="deskripsi" rows="3" maxlength="2000">${e(nilai.deskripsi)}</textarea>

  <label for="foto">Foto (JPG/PNG, maks. 2 MB)</label>
${fotoSekarang ? `  <img class="foto-kecil" src="/uploads/${e(fotoSekarang)}" alt="Foto saat ini">\n` : ''}  <input type="file" id="foto" name="foto" accept="image/jpeg,image/png">

  <div class="aksi-form">
    <button type="submit" class="tombol tombol-utama">${e(judulTombol)}</button>
    <a class="tombol" href="${e(beranda(c.pengguna))}">Batal</a>
  </div>
</form>
`;
}

module.exports = { e, formatTanggal, labelStatus, lencanaStatus, csrfField, beranda, kepala, kaki, galatHtml, kartuMakanan, formMakanan };
