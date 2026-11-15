'use strict';
/** Fitur Admin: ringkasan per lantai, manajemen pengguna, laporan logtime. */
const { semua, satu, jalankan, catatLog } = require('../db');
const makanan = require('./makanan');

function ringkasanPerLantai(makananAktif) {
  const hasil = {};
  makanan.daftarKulkas().forEach((k) => { hasil[k.lantai] ??= { total: 0, aman: 0, mendekati: 0, kadaluarsa: 0 }; });
  makananAktif.forEach((m) => { hasil[m.lantai].total += 1; hasil[m.lantai][m.status] += 1; });
  return hasil;   // kunci angka otomatis terurut naik
}

const daftarPengguna = () => semua(
  `SELECT p.id, p.nama, p.email, p.role, p.dibuat_pada,
          (SELECT COUNT(*) FROM makanan m WHERE m.pengguna_id = p.id AND m.kondisi = 'aktif') AS makanan_aktif
   FROM pengguna p ORDER BY p.role, p.nama`);

function ubahPeran(id, peranBaru, admin) {
  if (!['admin', 'pegawai'].includes(peranBaru)) return { ok: false, pesan: 'Peran tidak valid.' };
  const akun = satu('SELECT id, email, role FROM pengguna WHERE id = ?', id);
  if (!akun) return { ok: false, pesan: 'Akun tidak ditemukan.' };
  const jumlahAdmin = satu("SELECT COUNT(*) AS n FROM pengguna WHERE role = 'admin'").n;
  if (akun.role === 'admin' && peranBaru === 'pegawai' && jumlahAdmin <= 1) {
    return { ok: false, pesan: 'Admin terakhir tidak boleh diubah menjadi pegawai.' };
  }
  jalankan('UPDATE pengguna SET role = ? WHERE id = ?', peranBaru, id);
  catatLog(admin.id, 'ubah_peran', `${akun.email} -> ${peranBaru}`);
  return { ok: true, pesan: `Peran ${akun.email} diubah menjadi ${peranBaru}.` };
}

/** Laporan logtime: setiap makanan yang diinput (siapa, kapan, di kulkas mana). Tanggal berformat YYYY-MM-DD. */
const laporanLogtime = (dari, sampai) => semua(
  `SELECT m.id, m.dibuat_pada AS waktu_input, p.nama AS pegawai, p.email, k.keterangan AS kulkas,
          m.nama_makanan, m.tanggal_kadaluarsa, m.kondisi
   FROM makanan m JOIN pengguna p ON p.id = m.pengguna_id JOIN kulkas k ON k.id = m.kulkas_id
   WHERE date(m.dibuat_pada) BETWEEN ? AND ? ORDER BY m.dibuat_pada DESC`, dari, sampai);

const logAktivitasTerbaru = (batas = 20) => semua(
  `SELECT l.waktu, l.aksi, l.keterangan, p.nama FROM log_aktivitas l
   LEFT JOIN pengguna p ON p.id = l.pengguna_id ORDER BY l.id DESC LIMIT ${Number(batas) | 0}`);

function tanggalValid(teks) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(teks));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

module.exports = { ringkasanPerLantai, daftarPengguna, ubahPeran, laporanLogtime, logAktivitasTerbaru, tanggalValid };
