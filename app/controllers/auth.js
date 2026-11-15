'use strict';
/** Registrasi, login, dan hapus akun (Tugas 3 dan fitur tambahan Hapus Akun). */
const bcrypt = require('bcryptjs');
const { satu, semua, jalankan, catatLog } = require('../db');
const { putuskanHapusAkun } = require('../lib/validasi');
const makanan = require('./makanan');

const PASSWORD_MIN = 6;
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function registrasi(masukan) {
  const nama = String(masukan.nama ?? '').trim();
  const email = String(masukan.email ?? '').trim().toLowerCase();
  const password = String(masukan.password ?? '');
  const ulang = String(masukan.password_ulang ?? '');

  if (nama === '' || email === '' || password === '') return { ok: false, pesan: 'Nama, email, dan kata sandi wajib diisi.' };
  if (nama.length > 100 || email.length > 100) return { ok: false, pesan: 'Nama dan email maksimal 100 karakter.' };
  if (!POLA_EMAIL.test(email)) return { ok: false, pesan: 'Format email tidak valid.' };
  if (password.length < PASSWORD_MIN) return { ok: false, pesan: `Kata sandi minimal ${PASSWORD_MIN} karakter.` };
  if (password !== ulang) return { ok: false, pesan: 'Konfirmasi kata sandi tidak sama.' };
  if (satu('SELECT id FROM pengguna WHERE email = ?', email)) return { ok: false, pesan: 'Email sudah terdaftar.' };

  const r = jalankan("INSERT INTO pengguna (nama, email, password, role) VALUES (?, ?, ?, 'pegawai')",
    nama, email, bcrypt.hashSync(password, 10));
  catatLog(r.id, 'registrasi', email);
  return { ok: true, pesan: 'Registrasi berhasil. Silakan masuk.' };
}

/** Mengembalikan {ok, pesan, akun?}. Pembuatan sesi dilakukan oleh pemanggil. */
async function login(email, password) {
  email = String(email ?? '').trim().toLowerCase();
  password = String(password ?? '');
  if (email === '' || password === '') return { ok: false, pesan: 'Email dan kata sandi wajib diisi.' };

  const akun = satu('SELECT id, nama, email, password, role FROM pengguna WHERE email = ?', email);
  // Pesan sama untuk email tak terdaftar dan sandi salah (tidak membocorkan akun)
  if (!akun || !bcrypt.compareSync(password, akun.password)) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, pesan: 'Email atau kata sandi salah.' };
  }
  catatLog(akun.id, 'login', akun.email);
  return { ok: true, pesan: `Selamat datang, ${akun.nama}.`, akun: { id: akun.id, nama: akun.nama, email: akun.email, role: akun.role } };
}

/**
 * Hapus akun. Pegawai menghapus akun sendiri dengan konfirmasi kata sandi; Admin menghapus akun lain
 * tanpa kata sandi. Keputusan diambil oleh putuskanHapusAkun().
 * @param pelaku pengguna yang sedang login (atau null)
 */
function hapusAkun(targetId, passwordKonfirmasi, olehAdmin, pelaku) {
  const akun = satu('SELECT id, nama, email, password, role FROM pengguna WHERE id = ?', targetId);
  const jumlahAdmin = satu("SELECT COUNT(*) AS n FROM pengguna WHERE role = 'admin'").n;

  // Admin yang menghapus akun SENDIRI tetap wajib memasukkan kata sandi
  const hapusDiriSendiri = pelaku && pelaku.id === targetId;
  const perluSandi = !olehAdmin || hapusDiriSendiri;
  const passwordBenar = !!akun && passwordKonfirmasi !== '' && bcrypt.compareSync(passwordKonfirmasi, akun.password);

  const keputusan = putuskanHapusAkun(akun, jumlahAdmin, passwordBenar, !perluSandi);
  if (!keputusan.ok) return keputusan;

  // Ambil nama foto dulu, sebelum baris database terhapus
  const foto = semua('SELECT foto FROM makanan WHERE pengguna_id = ? AND foto IS NOT NULL', targetId);
  jalankan('DELETE FROM pengguna WHERE id = ?', targetId);      // CASCADE: makanan, notifikasi, chat
  foto.forEach((b) => makanan.hapusBerkasFoto(b.foto));
  catatLog(null, 'hapus_akun', `Akun ${akun.email} dihapus oleh ${pelaku ? pelaku.email : 'sistem'}`);
  return keputusan;
}

module.exports = { PASSWORD_MIN, registrasi, login, hapusAkun };
