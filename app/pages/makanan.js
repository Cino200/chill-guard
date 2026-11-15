'use strict';
const T = require('../lib/tampilan');
const mk = require('../controllers/makanan');
const notif = require('../controllers/notifikasi');
const { e, csrfField, kepala, kaki, galatHtml, kartuMakanan, formMakanan } = T;

const STATUS = ['aman', 'mendekati', 'kadaluarsa'];

function dashboard(c) {
  const p = c.wajibPegawai(); if (!p) return;
  notif.buatPengingatOtomatis();
  const cari = String(c.query.cari ?? '').trim();
  let filter = String(c.query.status ?? '');
  if (!STATUS.includes(filter)) filter = '';

  const semua = mk.daftarMilik(p.id);
  const ringkas = mk.ringkasan(semua);
  const daftar = mk.daftarMilik(p.id, cari, filter);
  // Banner: makanan yang sisa waktunya kurang dari 1 hari (H-1 / H-0) atau sudah kadaluarsa
  const mendesak = semua.filter((m) => m.sisa_detik < 86400);

  let h = kepala(c, 'Makanan Saya', 'dashboard') + '<h1>Makanan Saya</h1>\n\n';
  if (mendesak.length) {
    h += `<div class="banner" role="alert">
  <strong>Perhatian!</strong> ${mendesak.length} makanan perlu segera diambil:
  <ul>
${mendesak.map((m) => `    <li>${e(m.nama_makanan)} (${e(m.nama_kulkas)}) &mdash; ${e(m.teks_sisa)}</li>`).join('\n')}
  </ul>
</div>
`;
  }
  h += `<div class="ringkasan">
  <a class="angka angka-aman" href="/dashboard?status=aman"><b>${ringkas.aman}</b><span>Aman</span></a>
  <a class="angka angka-mendekati" href="/dashboard?status=mendekati"><b>${ringkas.mendekati}</b><span>Mendekati</span></a>
  <a class="angka angka-kadaluarsa" href="/dashboard?status=kadaluarsa"><b>${ringkas.kadaluarsa}</b><span>Kadaluarsa</span></a>
</div>

<form method="get" class="cari">
  <input type="search" name="cari" value="${e(cari)}" placeholder="Cari nama, deskripsi, barcode..." aria-label="Cari makanan">
  <select name="status" aria-label="Filter status">
    <option value="">Semua status</option>
${STATUS.map((s) => `    <option value="${s}"${filter === s ? ' selected' : ''}>${T.labelStatus(s)}</option>`).join('\n')}
  </select>
  <button class="tombol tombol-utama">Cari</button>
  <a class="tombol" href="/makanan/tambah">+ Tambah Makanan</a>
</form>

`;
  if (!daftar.length) h += `<p class="kosong">${cari !== '' || filter !== '' ? 'Tidak ada makanan yang cocok.' : 'Belum ada makanan. Klik "+ Tambah Makanan".'}</p>\n`;
  h += '<div class="grid">\n' + daftar.map((m) => kartuMakanan(c, m, { kembali: '/dashboard' })).join('') + '</div>\n';
  c.html(h + kaki());
}

function tambah(c) {
  const p = c.wajibPegawai(); if (!p) return;
  let nilai = { nama_makanan: '', kulkas_id: 0, tanggal_kadaluarsa: '', barcode: '', deskripsi: '' };
  let galat = '';
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    for (const k of Object.keys(nilai)) nilai[k] = String(c.body[k] ?? '');
    const hasil = mk.tambah(p.id, c.body, c.files);
    if (hasil.ok) { c.setFlash('sukses', hasil.pesan); return c.redirect('/dashboard'); }
    galat = hasil.pesan;
  }
  c.html(kepala(c, 'Tambah Makanan', 'makanan_tambah') + `<section class="kartu">
  <h1>Tambah Makanan</h1>
${galatHtml(galat)}${formMakanan(c, nilai, mk.daftarKulkas(), 'Simpan')}</section>
` + kaki());
}

function ubah(c) {
  const p = c.wajibLogin(); if (!p) return;
  const id = parseInt(c.query.id ?? c.body.id ?? '0', 10) || 0;
  const m = mk.ambil(id);
  if (!m || m.kondisi !== 'aktif' || (p.role !== 'admin' && m.pengguna_id !== p.id)) {
    c.setFlash('galat', 'Makanan tidak ditemukan atau bukan milik Anda.');
    return c.redirect(T.beranda(p));
  }
  const nilai = {
    nama_makanan: m.nama_makanan, kulkas_id: m.kulkas_id,
    tanggal_kadaluarsa: m.tanggal_kadaluarsa.slice(0, 16).replace(' ', 'T'),
    barcode: m.barcode ?? '', deskripsi: m.deskripsi ?? '',
  };
  let galat = '';
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    for (const k of Object.keys(nilai)) nilai[k] = String(c.body[k] ?? '');
    const hasil = mk.ubah(id, p, c.body, c.files);
    if (hasil.ok) { c.setFlash('sukses', hasil.pesan); return c.redirect(T.beranda(p)); }
    galat = hasil.pesan;
  }
  c.html(kepala(c, 'Ubah Makanan', 'dashboard') + `<section class="kartu">
  <h1>Ubah Makanan</h1>
${galatHtml(galat)}${formMakanan(c, nilai, mk.daftarKulkas(), 'Simpan Perubahan', m.foto)}</section>
` + kaki());
}

function aksi(c) {
  const p = c.wajibLogin(); if (!p) return;
  if (c.method !== 'POST') return c.redirect(T.beranda(p));
  if (!c.cekCsrf()) return;
  const id = parseInt(c.body.id ?? '0', 10) || 0;
  const a = String(c.body.aksi ?? '');
  const boleh = ['/dashboard', '/admin', '/admin/sampah'];
  const kembali = boleh.includes(String(c.body.kembali ?? '')) ? c.body.kembali : T.beranda(p);
  const lapor = (ok, sukses, gagal) => c.setFlash(ok ? 'sukses' : 'galat', ok ? sukses : gagal);
  const salah = 'Makanan tidak ditemukan atau bukan milik Anda.';

  if (a === 'hapus') lapor(mk.hapus(id, p), 'Makanan dipindahkan ke Recycle Bin.', salah);
  else if (a === 'selesai') lapor(mk.selesai(id, p), 'Makanan ditandai sudah diambil.', salah);
  else if (p.role === 'admin' && a === 'pulihkan') lapor(mk.pulihkan(id, p), 'Makanan dipulihkan.', 'Makanan tidak ditemukan di Recycle Bin.');
  else if (p.role === 'admin' && a === 'hapus_permanen') lapor(mk.hapusPermanen(id, p), 'Makanan dihapus permanen.', 'Makanan tidak ditemukan di Recycle Bin.');
  else c.setFlash('galat', 'Aksi tidak dikenal.');
  c.redirect(kembali);
}

module.exports = { dashboard, tambah, ubah, aksi };
