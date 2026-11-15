'use strict';
const T = require('../lib/tampilan');
const auth = require('../controllers/auth');
const { e, csrfField, kepala, kaki, galatHtml } = T;

async function masuk(c) {
  if (c.pengguna) return c.redirect(T.beranda(c.pengguna));
  let galat = '';
  let email = '';
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    email = String(c.body.email ?? '');
    const hasil = await auth.login(email, c.body.password);
    if (hasil.ok) {
      c.masukkan(hasil.akun);
      c.setFlash('sukses', hasil.pesan);
      return c.redirect(T.beranda(hasil.akun));
    }
    galat = hasil.pesan;
  }
  c.html(kepala(c, 'Masuk') + `<section class="kartu form-sempit">
  <h1>Masuk</h1>
  <p class="redup">Sistem cerdas penyimpanan makanan pada kulkas &mdash; DJPK.</p>
${galatHtml(galat)}  <form method="post" autocomplete="on">
    ${csrfField(c)}
    <label for="email">Email</label>
    <input type="email" id="email" name="email" value="${e(email)}" required autofocus>
    <label for="password">Kata sandi</label>
    <input type="password" id="password" name="password" required>
    <button type="submit" class="tombol tombol-utama tombol-penuh">Masuk</button>
  </form>
  <p class="tengah">Belum punya akun? <a href="/daftar">Daftar</a></p>
  <p class="tengah"><a href="#" id="tautanServer" hidden>Pengaturan Server</a></p>
  <details class="demo">
    <summary>Akun demo</summary>
    <p>Admin: <code>admin@chillguard.local</code> / <code>admin123</code><br>
       Pegawai: <code>rudy@chillguard.local</code> / <code>pegawai123</code></p>
  </details>
</section>
` + kaki());
}

function daftar(c) {
  if (c.pengguna) return c.redirect(T.beranda(c.pengguna));
  let galat = '';
  let nilai = { nama: '', email: '' };
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    nilai = { nama: String(c.body.nama ?? ''), email: String(c.body.email ?? '') };
    const hasil = auth.registrasi(c.body);
    if (hasil.ok) {
      c.setFlash('sukses', hasil.pesan);
      return c.redirect('/masuk');
    }
    galat = hasil.pesan;
  }
  c.html(kepala(c, 'Daftar') + `<section class="kartu form-sempit">
  <h1>Daftar Akun Pegawai</h1>
${galatHtml(galat)}  <form method="post">
    ${csrfField(c)}
    <label for="nama">Nama lengkap</label>
    <input type="text" id="nama" name="nama" value="${e(nilai.nama)}" maxlength="100" required autofocus>
    <label for="email">Email</label>
    <input type="email" id="email" name="email" value="${e(nilai.email)}" maxlength="100" required>
    <label for="password">Kata sandi (minimal ${auth.PASSWORD_MIN} karakter)</label>
    <input type="password" id="password" name="password" minlength="${auth.PASSWORD_MIN}" required>
    <label for="password_ulang">Ulangi kata sandi</label>
    <input type="password" id="password_ulang" name="password_ulang" required>
    <button type="submit" class="tombol tombol-utama tombol-penuh">Daftar</button>
  </form>
  <p class="tengah">Sudah punya akun? <a href="/masuk">Masuk</a></p>
</section>
` + kaki());
}

/** Keluar lewat POST agar tidak bisa dipicu tautan/gambar dari situs lain. */
function keluar(c) {
  if (c.method === 'POST') {
    if (!c.cekCsrf()) return;
    if (c.pengguna) require('../db').catatLog(c.pengguna.id, 'logout', c.pengguna.email);
    c.keluarkan();
    c.setFlash('info', 'Anda telah keluar.');
    return c.redirect('/masuk');
  }
  c.html(kepala(c, 'Keluar') + `<section class="kartu form-sempit">
  <h1>Keluar</h1>
  <form method="post">
    ${csrfField(c)}
    <p>Yakin ingin keluar dari Chill Guard?</p>
    <button type="submit" class="tombol tombol-utama">Ya, keluar</button>
    <a class="tombol" href="/">Batal</a>
  </form>
</section>
` + kaki());
}

module.exports = { masuk, daftar, keluar };
