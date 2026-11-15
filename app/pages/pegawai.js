'use strict';
const T = require('../lib/tampilan');
const auth = require('../controllers/auth');
const notif = require('../controllers/notifikasi');
const chatC = require('../controllers/chat');
const { satu } = require('../db');
const { e, csrfField, kepala, kaki, galatHtml, formatTanggal } = T;

function profil(c) {
  const p = c.wajibPegawai(); if (!p) return;
  let galat = '';
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    if (c.body.aksi === 'hapus_akun') {
      const hasil = auth.hapusAkun(p.id, String(c.body.password ?? ''), false, p);
      if (hasil.ok) {
        c.keluarkan();
        c.setFlash('sukses', 'Akun berhasil dihapus beserta seluruh datanya.');
        return c.redirect('/masuk');
      }
      galat = hasil.pesan;
    }
  }
  const jumlah = satu("SELECT COUNT(*) AS n FROM makanan WHERE pengguna_id = ? AND kondisi <> 'dihapus'", p.id).n;
  c.html(kepala(c, 'Profil', 'profil') + `<h1>Profil</h1>
<section class="kartu">
  <dl class="rincian">
    <dt>Nama</dt><dd>${e(p.nama)}</dd>
    <dt>Email</dt><dd>${e(p.email)}</dd>
    <dt>Peran</dt><dd>${e(p.role)}</dd>
    <dt>Makanan tercatat</dt><dd>${jumlah}</dd>
  </dl>
</section>

<section class="kartu zona-bahaya">
  <h2>Hapus Akun</h2>
  <p>Menghapus akun akan <strong>menghapus permanen</strong> seluruh makanan, notifikasi, dan chat milik Anda.
     Tindakan ini tidak dapat dibatalkan. Masukkan kata sandi untuk konfirmasi.</p>
${galatHtml(galat)}  <form method="post" class="form-sempit-kiri">
    ${csrfField(c)}
    <input type="hidden" name="aksi" value="hapus_akun">
    <label for="password">Kata sandi</label>
    <input type="password" id="password" name="password" required>
    <button type="submit" class="tombol tombol-bahaya" data-konfirmasi="Hapus akun Anda secara permanen? Semua data ikut terhapus.">Hapus Akun Saya</button>
  </form>
</section>
` + kaki());
}

function notifikasi(c) {
  const p = c.wajibPegawai(); if (!p) return;
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    if (c.body.aksi === 'semua') notif.tandaiDibaca(p.id);
    else if (c.body.aksi === 'satu') notif.tandaiDibaca(p.id, parseInt(c.body.id ?? '0', 10) || 0);
    return c.redirect('/notifikasi');
  }
  notif.buatPengingatOtomatis();
  const daftar = notif.daftar(p.id);
  let h = kepala(c, 'Notifikasi', 'notifikasi') + '<h1>Notifikasi</h1>\n';
  if (daftar.length) {
    h += `<form method="post" class="sebaris">
  ${csrfField(c)}<input type="hidden" name="aksi" value="semua">
  <button class="tombol tombol-kecil">Tandai semua dibaca</button>
</form>
`;
  } else h += '<p class="kosong">Belum ada notifikasi.</p>';
  h += '<ul class="daftar-notif">\n';
  for (const n of daftar) {
    h += `  <li class="notif ${n.dibaca ? '' : 'baru'} notif-${e(n.jenis)}">
    <div>
      <span class="label-notif">${n.jenis === 'alarm_admin' ? 'Alarm Admin' : 'Pengingat'}</span>
      <p>${e(n.pesan)}</p>
      <small>${e(formatTanggal(n.tanggal_kirim))}</small>
    </div>
${n.dibaca ? '' : `    <form method="post">${csrfField(c)}<input type="hidden" name="aksi" value="satu"><input type="hidden" name="id" value="${n.id}">
      <button class="tombol tombol-kecil">Tandai dibaca</button></form>\n`}  </li>\n`;
  }
  c.html(h + '</ul>\n' + kaki());
}

function chat(c) {
  const p = c.wajibLogin(); if (!p) return;
  const admin = p.role === 'admin';
  // Lawan bicara: pegawai -> admin utama; admin -> pegawai terpilih
  const lawanId = admin ? (parseInt(c.query.dengan ?? c.body.dengan ?? '0', 10) || 0) : (chatC.idAdminUtama() || 0);

  const ajax = String(c.query.ajax ?? c.body.ajax ?? '');
  if (ajax !== '') {
    if (lawanId <= 0 || !chatC.bolehBerbicara(p, lawanId)) return c.json({ ok: false, pesan: 'Lawan bicara tidak valid' }, 403);
    if (ajax === 'kirim' && c.method === 'POST') {
      if (!c.cekCsrf()) return;
      const ok = chatC.kirim(p.id, lawanId, c.body.pesan);
      return c.json({ ok, pesan: ok ? '' : 'Pesan kosong atau lebih dari 500 karakter' });
    }
    const pesan = chatC.ambilPesan(p.id, lawanId, parseInt(c.query.setelah ?? '0', 10) || 0);
    return c.json({ ok: true, pesan: pesan.map((x) => ({
      id: x.id, dari_saya: x.pengirim_id === p.id, teks: x.pesan, waktu: x.waktu.slice(11, 16),
    })) });
  }

  let h = kepala(c, 'Chat', 'chat') + '<h1>Live Chat</h1>\n';
  if (admin && lawanId <= 0) {
    const lawan = chatC.daftarLawanBicara(p.id);
    h += '<section class="kartu">\n  <h2>Pilih pegawai</h2>\n' + (lawan.length ? '' : '<p class="kosong">Belum ada pegawai.</p>\n') + '  <ul class="daftar-lawan">\n';
    for (const l of lawan) {
      h += `    <li><a href="/chat?dengan=${l.id}">${e(l.nama)} <small>${e(l.email)}</small>${l.belum > 0 ? `<span class="lencana lencana-kadaluarsa">${l.belum} baru</span>` : ''}</a></li>\n`;
    }
    h += '  </ul>\n</section>\n';
  } else if (lawanId <= 0 || !chatC.bolehBerbicara(p, lawanId)) {
    h += '<p class="kosong">Belum ada Admin yang dapat dihubungi.</p>\n';
  } else {
    const dengan = satu('SELECT nama FROM pengguna WHERE id = ?', lawanId);
    h += `<section class="kartu chat" data-dengan="${lawanId}" data-csrf="${e(c.csrfToken())}">
  <div class="chat-kepala">
    Percakapan dengan <strong>${e(dengan.nama)}</strong>
${admin ? '<a class="tombol tombol-kecil" href="/chat">&larr; Daftar</a>' : ''}
  </div>
  <div class="chat-isi" id="chatIsi" aria-live="polite"></div>
  <form class="chat-form" id="chatForm" autocomplete="off">
    <input type="text" id="chatPesan" maxlength="500" placeholder="Tulis pesan..." required>
    <button class="tombol tombol-utama">Kirim</button>
  </form>
</section>
`;
  }
  c.html(h + kaki());
}

module.exports = { profil, notifikasi, chat };
