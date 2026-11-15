'use strict';
/** Live chat Pegawai <-> Admin (pembaruan lewat polling AJAX). */
const { semua, satu, jalankan } = require('../db');
const { formatWib } = require('../lib/waktu');

/** Pegawai selalu mengobrol dengan admin pertama (admin utama). */
function idAdminUtama() {
  const b = satu("SELECT id FROM pengguna WHERE role = 'admin' ORDER BY id LIMIT 1");
  return b ? b.id : null;
}

const jumlahBelumDibaca = (penggunaId) =>
  satu('SELECT COUNT(*) AS n FROM chat WHERE penerima_id = ? AND dibaca = 0', penggunaId).n;

/** Daftar lawan bicara untuk Admin: semua pegawai beserta jumlah pesan belum dibaca. */
const daftarLawanBicara = (adminId) => semua(
  `SELECT p.id, p.nama, p.email,
          (SELECT COUNT(*) FROM chat c WHERE c.pengirim_id = p.id AND c.penerima_id = ? AND c.dibaca = 0) AS belum
   FROM pengguna p WHERE p.role = 'pegawai' ORDER BY belum DESC, p.nama`, adminId);

/** Boleh mengobrol hanya antara pegawai dan admin. */
function bolehBerbicara(pengguna, lawanId) {
  const lawan = satu('SELECT role FROM pengguna WHERE id = ?', lawanId);
  return !!lawan && pengguna.role !== lawan.role;
}

function kirim(pengirimId, penerimaId, pesan) {
  pesan = String(pesan ?? '').trim();
  if (pesan === '' || pesan.length > 500) return false;
  jalankan('INSERT INTO chat (pengirim_id, penerima_id, pesan, waktu) VALUES (?, ?, ?, ?)',
    pengirimId, penerimaId, pesan, formatWib(Date.now()));
  return true;
}

/** Pesan setelah id tertentu (untuk polling) dan menandai pesan masuk sebagai dibaca. */
function ambilPesan(saya, lawan, setelahId = 0) {
  const pesan = semua(
    `SELECT id, pengirim_id, pesan, waktu FROM chat
     WHERE id > ? AND ((pengirim_id = ? AND penerima_id = ?) OR (pengirim_id = ? AND penerima_id = ?))
     ORDER BY id LIMIT 200`, setelahId, saya, lawan, lawan, saya);
  jalankan('UPDATE chat SET dibaca = 1 WHERE penerima_id = ? AND pengirim_id = ? AND dibaca = 0', saya, lawan);
  return pesan;
}

module.exports = { idAdminUtama, jumlahBelumDibaca, daftarLawanBicara, bolehBerbicara, kirim, ambilPesan };
