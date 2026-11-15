'use strict';
const T = require('../lib/tampilan');
const mk = require('../controllers/makanan');
const notif = require('../controllers/notifikasi');
const adm = require('../controllers/admin');
const auth = require('../controllers/auth');
const { semua } = require('../db');
const { formatWib } = require('../lib/waktu');
const { e, csrfField, kepala, kaki, formatTanggal, kartuMakanan } = T;

const STATUS = ['aman', 'mendekati', 'kadaluarsa'];

function pantau(c) {
  const a = c.wajibAdmin(); if (!a) return;
  notif.buatPengingatOtomatis();
  const lantai = parseInt(c.query.lantai ?? '0', 10) || 0;
  const cari = String(c.query.cari ?? '').trim();
  let filter = String(c.query.status ?? '');
  if (!STATUS.includes(filter)) filter = '';

  const semuaM = mk.daftarSemua();
  const perLantai = adm.ringkasanPerLantai(semuaM);
  const total = mk.ringkasan(semuaM);
  const daftar = mk.daftarSemua(lantai, cari, filter);

  let h = kepala(c, 'Pantau Makanan', 'admin') + `<h1>Pantau Makanan</h1>

<div class="ringkasan">
  <a class="angka angka-aman" href="/admin?status=aman"><b>${total.aman}</b><span>Aman</span></a>
  <a class="angka angka-mendekati" href="/admin?status=mendekati"><b>${total.mendekati}</b><span>Mendekati</span></a>
  <a class="angka angka-kadaluarsa" href="/admin?status=kadaluarsa"><b>${total.kadaluarsa}</b><span>Kadaluarsa</span></a>
</div>

<section class="kartu">
  <h2>Per lantai</h2>
  <div class="tabel-gulir">
  <table class="tabel">
    <thead><tr><th>Lantai</th><th>Total</th><th>Aman</th><th>Mendekati</th><th>Kadaluarsa</th><th></th></tr></thead>
    <tbody>
`;
  for (const [no, r] of Object.entries(perLantai)) {
    h += `      <tr${lantai === +no ? ' class="terpilih"' : ''}>
        <td>Lantai ${no}</td><td>${r.total}</td><td>${r.aman}</td><td>${r.mendekati}</td><td>${r.kadaluarsa}</td>
        <td><a href="/admin?lantai=${no}">Lihat</a></td>
      </tr>
`;
  }
  h += `    </tbody>
  </table>
  </div>
</section>

<form method="get" class="cari">
  <select name="lantai" aria-label="Lantai">
    <option value="0">Semua lantai</option>
${Object.keys(perLantai).map((no) => `    <option value="${no}"${lantai === +no ? ' selected' : ''}>Lantai ${no}</option>`).join('\n')}
  </select>
  <input type="search" name="cari" value="${e(cari)}" placeholder="Cari makanan atau pemilik..." aria-label="Cari">
  <select name="status" aria-label="Status">
    <option value="">Semua status</option>
${STATUS.map((s) => `    <option value="${s}"${filter === s ? ' selected' : ''}>${T.labelStatus(s)}</option>`).join('\n')}
  </select>
  <button class="tombol tombol-utama">Terapkan</button>
  <a class="tombol" href="/admin/alarm">Kirim alarm umum</a>
</form>

`;
  if (!daftar.length) h += '<p class="kosong">Tidak ada makanan yang cocok.</p>\n';
  h += '<div class="grid">\n' + daftar.map((m) => kartuMakanan(c, m, { tampilPemilik: true, tampilAdmin: true, kembali: '/admin' })).join('') + '</div>\n';
  c.html(h + kaki());
}

function alarm(c) {
  const a = c.wajibAdmin(); if (!a) return;
  const makananId = parseInt(c.query.makanan ?? c.body.makanan ?? '0', 10) || 0;
  const m = makananId > 0 ? mk.ambil(makananId) : null;
  if (makananId > 0 && !m) { c.setFlash('galat', 'Makanan tidak ditemukan.'); return c.redirect('/admin'); }

  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    const hasil = m
      ? notif.kirimAlarmMakanan(makananId, c.body.pesan, a)
      : notif.kirimAlarmUmum(parseInt(c.body.penerima ?? '0', 10) || 0, c.body.pesan, a);
    c.setFlash(hasil.ok ? 'sukses' : 'galat', hasil.pesan);
    return c.redirect('/admin');
  }
  const pegawai = semua("SELECT id, nama FROM pengguna WHERE role = 'pegawai' ORDER BY nama");
  c.html(kepala(c, 'Kirim Alarm', 'admin') + `<section class="kartu form-sempit">
  <h1>Kirim Alarm</h1>
${m ? `  <p>Makanan: <strong>${e(m.nama_makanan)}</strong> (${e(m.nama_kulkas)}, ${e(m.teks_sisa)})<br>
     Penerima: <strong>${e(m.nama_pemilik)}</strong></p>\n` : ''}  <form method="post">
    ${csrfField(c)}
    <input type="hidden" name="makanan" value="${makananId}">
${m ? '' : `    <label for="penerima">Penerima</label>
    <select id="penerima" name="penerima">
      <option value="0">Semua pegawai</option>
${pegawai.map((p) => `      <option value="${p.id}">${e(p.nama)}</option>`).join('\n')}
    </select>\n`}    <label for="pesan">Pesan${m ? ' tambahan (opsional)' : ''}</label>
    <textarea id="pesan" name="pesan" rows="3" maxlength="150"${m ? '' : ' required'}></textarea>
    <button class="tombol tombol-utama">Kirim alarm</button>
    <a class="tombol" href="/admin">Batal</a>
  </form>
</section>
` + kaki());
}

function sampah(c) {
  const a = c.wajibAdmin(); if (!a) return;
  const daftar = mk.daftarSampah();
  let h = kepala(c, 'Recycle Bin', 'admin_sampah') + `<h1>Recycle Bin</h1>
<p class="redup">Makanan yang dihapus pegawai. Admin dapat memulihkan atau menghapus permanen.</p>
`;
  if (!daftar.length) return c.html(h + '<p class="kosong">Recycle Bin kosong.</p>\n' + kaki());
  h += `<div class="tabel-gulir">
<table class="tabel">
  <thead><tr><th>Makanan</th><th>Pemilik</th><th>Lokasi</th><th>Kadaluarsa</th><th>Dihapus</th><th></th></tr></thead>
  <tbody>
`;
  for (const m of daftar) {
    h += `    <tr>
      <td>${e(m.nama_makanan)}</td>
      <td>${e(m.nama_pemilik)}</td>
      <td>${e(m.nama_kulkas)}</td>
      <td>${e(formatTanggal(m.tanggal_kadaluarsa))}</td>
      <td>${e(m.dihapus_pada ? formatTanggal(m.dihapus_pada) : '-')}</td>
      <td>
        <form method="post" action="/makanan/aksi" class="sebaris">
          ${csrfField(c)}
          <input type="hidden" name="id" value="${m.id}">
          <input type="hidden" name="kembali" value="/admin/sampah">
          <button name="aksi" value="pulihkan" class="tombol tombol-kecil">Pulihkan</button>
          <button name="aksi" value="hapus_permanen" class="tombol tombol-kecil tombol-bahaya" data-konfirmasi="Hapus permanen &quot;${e(m.nama_makanan)}&quot;? Tidak dapat dibatalkan.">Hapus permanen</button>
        </form>
      </td>
    </tr>
`;
  }
  c.html(h + '  </tbody>\n</table>\n</div>\n' + kaki());
}

function pengguna(c) {
  const a = c.wajibAdmin(); if (!a) return;
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    const id = parseInt(c.body.id ?? '0', 10) || 0;
    const aksi = String(c.body.aksi ?? '');
    let hasil;
    if (aksi === 'hapus') {
      hasil = auth.hapusAkun(id, String(c.body.password ?? ''), true, a);
      if (hasil.ok && id === a.id) {
        c.keluarkan();
        c.setFlash('sukses', 'Akun Anda telah dihapus.');
        return c.redirect('/masuk');
      }
    } else if (aksi === 'peran') {
      hasil = adm.ubahPeran(id, String(c.body.peran ?? ''), a);
    } else hasil = { ok: false, pesan: 'Aksi tidak dikenal.' };
    c.setFlash(hasil.ok ? 'sukses' : 'galat', hasil.pesan);
    return c.redirect('/admin/pengguna');
  }

  const daftar = adm.daftarPengguna();
  let h = kepala(c, 'Pengguna', 'admin_pengguna') + `<h1>Pengguna</h1>
<div class="tabel-gulir">
<table class="tabel">
  <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Makanan aktif</th><th>Aksi</th></tr></thead>
  <tbody>
`;
  for (const p of daftar) {
    const diri = p.id === a.id;
    h += `    <tr>
      <td>${e(p.nama)}${diri ? ' <small>(Anda)</small>' : ''}</td>
      <td>${e(p.email)}</td>
      <td>${e(p.role)}</td>
      <td>${p.makanan_aktif}</td>
      <td>
        <form method="post" class="sebaris">
          ${csrfField(c)}
          <input type="hidden" name="id" value="${p.id}">
          <input type="hidden" name="aksi" value="peran">
          <input type="hidden" name="peran" value="${p.role === 'admin' ? 'pegawai' : 'admin'}">
          <button class="tombol tombol-kecil" data-konfirmasi="Ubah peran ${e(p.email)}?">${p.role === 'admin' ? 'Jadikan pegawai' : 'Jadikan admin'}</button>
        </form>
${diri ? '        <small>Hapus akun sendiri lewat tombol di bawah.</small>\n' : `        <form method="post" class="sebaris">
          ${csrfField(c)}
          <input type="hidden" name="id" value="${p.id}">
          <input type="hidden" name="aksi" value="hapus">
          <button class="tombol tombol-kecil tombol-bahaya" data-konfirmasi="Hapus akun ${e(p.email)} beserta seluruh datanya?">Hapus</button>
        </form>\n`}      </td>
    </tr>
`;
  }
  h += `  </tbody>
</table>
</div>

<section class="kartu zona-bahaya">
  <h2>Hapus akun saya (Admin)</h2>
  <form method="post" class="form-sempit-kiri">
    ${csrfField(c)}
    <input type="hidden" name="id" value="${a.id}">
    <input type="hidden" name="aksi" value="hapus">
    <label for="passwordAdmin">Kata sandi</label>
    <input type="password" id="passwordAdmin" name="password" required>
    <button class="tombol tombol-bahaya" data-konfirmasi="Hapus akun Admin Anda secara permanen?">Hapus akun saya</button>
  </form>
  <p class="bantuan">Admin terakhir tidak dapat dihapus.</p>
</section>

<section class="kartu">
  <h2>Aktivitas terbaru</h2>
  <ul class="log">
`;
  for (const l of adm.logAktivitasTerbaru(15)) {
    h += `    <li><small>${e(formatTanggal(l.waktu))}</small> <strong>${e(l.aksi)}</strong>
      ${e(l.nama ?? '(akun terhapus)')} &mdash; ${e(l.keterangan)}</li>\n`;
  }
  c.html(h + '  </ul>\n</section>\n' + kaki());
}

function laporan(c) {
  const a = c.wajibAdmin(); if (!a) return;
  const hariIni = formatWib(Date.now()).slice(0, 10);
  const awal = formatWib(Date.now() - 30 * 86400000).slice(0, 10);
  let dari = String(c.query.dari ?? awal);
  let sampai = String(c.query.sampai ?? hariIni);
  if (!adm.tanggalValid(dari)) dari = awal;
  if (!adm.tanggalValid(sampai)) sampai = hariIni;
  if (dari > sampai) [dari, sampai] = [sampai, dari];
  const data = adm.laporanLogtime(dari, sampai);

  const format = String(c.query.format ?? '');
  if (format === 'csv') {
    // BOM agar Excel membaca huruf dengan benar; awali apostrof bila sel diawali karakter rumus (cegah CSV injection)
    const aman = (s) => (/^[=+\-@]/.test(s) ? "'" + s : s);
    const sel = (s) => { s = String(s ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const baris = [['Waktu input', 'Pegawai', 'Email', 'Kulkas', 'Makanan', 'Kadaluarsa', 'Kondisi']];
    for (const b of data) baris.push([b.waktu_input, aman(b.pegawai), b.email, b.kulkas, aman(b.nama_makanan), b.tanggal_kadaluarsa, b.kondisi]);
    return c.kirim('﻿' + baris.map((r) => r.map(sel).join(',')).join('\r\n') + '\r\n', 'text/csv; charset=utf-8',
      { 'Content-Disposition': `attachment; filename="laporan-logtime-${dari}_${sampai}.csv"` });
  }

  let h = kepala(c, 'Laporan Logtime', 'admin_laporan') + `<h1>Laporan Logtime</h1>
<p class="redup">Catatan waktu input makanan oleh pegawai pada rentang tanggal terpilih.</p>

<form method="get" class="cari tanpa-cetak">
  <label>Dari <input type="date" name="dari" value="${e(dari)}"></label>
  <label>Sampai <input type="date" name="sampai" value="${e(sampai)}"></label>
  <button class="tombol tombol-utama">Tampilkan</button>
  <a class="tombol" href="/admin/laporan?format=csv&amp;dari=${e(dari)}&amp;sampai=${e(sampai)}">Unduh CSV</a>
  <button type="button" class="tombol" onclick="window.print()">Cetak / Simpan PDF</button>
</form>

<p><strong>${data.length}</strong> catatan, ${e(dari)} s.d. ${e(sampai)}.</p>
<div class="tabel-gulir">
<table class="tabel">
  <thead><tr><th>Waktu input</th><th>Pegawai</th><th>Kulkas</th><th>Makanan</th><th>Kadaluarsa</th><th>Kondisi</th></tr></thead>
  <tbody>
`;
  for (const b of data) {
    h += `    <tr>
      <td>${e(formatTanggal(b.waktu_input))}</td>
      <td>${e(b.pegawai)}</td>
      <td>${e(b.kulkas)}</td>
      <td>${e(b.nama_makanan)}</td>
      <td>${e(formatTanggal(b.tanggal_kadaluarsa))}</td>
      <td>${e(b.kondisi)}</td>
    </tr>
`;
  }
  if (!data.length) h += '    <tr><td colspan="6" class="kosong">Tidak ada data pada rentang ini.</td></tr>\n';
  h += '  </tbody>\n</table>\n</div>\n';
  if (format === 'cetak') h += "<script>window.addEventListener('load', function(){ window.print(); });</script>\n";
  c.html(h + kaki());
}

module.exports = { pantau, alarm, sampah, pengguna, laporan };
