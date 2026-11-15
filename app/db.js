'use strict';
/**
 * Database SQLite (bawaan Node.js, tanpa server database terpisah).
 * Berkas: data\chillguard.db. Dibuat dan diisi data contoh otomatis saat pertama kali dijalankan.
 * Semua kueri memakai parameter terikat (aman dari SQL injection).
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Sembunyikan peringatan "SQLite is an experimental feature" agar jendela server rapi
const emitAsli = process.emitWarning;
process.emitWarning = function (w, ...args) {
  if (String(w && w.message ? w.message : w).includes('SQLite')) return;
  return emitAsli.call(process, w, ...args);
};
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { formatWib } = require('./lib/waktu');

const SKEMA = `
CREATE TABLE IF NOT EXISTS pengguna (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nama        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,                       -- hash bcrypt (KNF-03)
  role        TEXT NOT NULL DEFAULT 'pegawai' CHECK (role IN ('admin','pegawai')),
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);
CREATE TABLE IF NOT EXISTS kulkas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  lantai       INTEGER NOT NULL,
  nomor_kulkas INTEGER NOT NULL DEFAULT 1,
  keterangan   TEXT,
  UNIQUE (lantai, nomor_kulkas)
);
CREATE TABLE IF NOT EXISTS makanan (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  pengguna_id        INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  kulkas_id          INTEGER NOT NULL REFERENCES kulkas(id) ON DELETE RESTRICT,
  nama_makanan       TEXT NOT NULL,
  deskripsi          TEXT,
  barcode            TEXT,
  foto               TEXT,
  tanggal_kadaluarsa TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'aman' CHECK (status IN ('aman','mendekati','kadaluarsa')),
  kondisi            TEXT NOT NULL DEFAULT 'aktif' CHECK (kondisi IN ('aktif','selesai','dihapus')),
  dibuat_pada        TEXT NOT NULL DEFAULT (datetime('now','+7 hours')),
  dihapus_pada       TEXT
);
CREATE INDEX IF NOT EXISTS idx_makanan_pengguna ON makanan(pengguna_id);
CREATE INDEX IF NOT EXISTS idx_makanan_kadaluarsa ON makanan(tanggal_kadaluarsa);
CREATE TABLE IF NOT EXISTS notifikasi (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pengguna_id   INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  makanan_id    INTEGER REFERENCES makanan(id) ON DELETE CASCADE,
  jenis         TEXT NOT NULL DEFAULT 'pengingat' CHECK (jenis IN ('pengingat','alarm_admin')),
  pesan         TEXT NOT NULL,
  dibaca        INTEGER NOT NULL DEFAULT 0,
  tanggal_kirim TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);
CREATE INDEX IF NOT EXISTS idx_notif_pengguna ON notifikasi(pengguna_id, dibaca);
CREATE TABLE IF NOT EXISTS chat (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pengirim_id INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  penerima_id INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  pesan       TEXT NOT NULL,
  dibaca      INTEGER NOT NULL DEFAULT 0,
  waktu       TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pengguna_id INTEGER REFERENCES pengguna(id) ON DELETE SET NULL,   -- audit tetap ada walau akun dihapus
  aksi        TEXT NOT NULL,
  keterangan  TEXT,
  waktu       TEXT NOT NULL DEFAULT (datetime('now','+7 hours'))
);
`;

// 17 kulkas di lantai 2,3,4,5,7,8,9,10,11,12 (tidak ada lantai 6)
const KULKAS = [
  [2, 1, 'Lantai 2'],
  [3, 1, 'Lantai 3 - Kulkas 1'], [3, 2, 'Lantai 3 - Kulkas 2'],
  [4, 1, 'Lantai 4 - Kulkas 1'], [4, 2, 'Lantai 4 - Kulkas 2'],
  [5, 1, 'Lantai 5 - dekat ruang laktasi dan ruang rapat umum'],
  [7, 1, 'Lantai 7 - Kulkas 1'], [7, 2, 'Lantai 7 - Kulkas 2'],
  [8, 1, 'Lantai 8 - Kulkas 1'], [8, 2, 'Lantai 8 - Kulkas 2'],
  [9, 1, 'Lantai 9 - Pak Dirjen dan tim protokol'],
  [10, 1, 'Lantai 10 - Kulkas 1'], [10, 2, 'Lantai 10 - Kulkas 2'],
  [11, 1, 'Lantai 11 - Kulkas 1'], [11, 2, 'Lantai 11 - Kulkas 2'],
  [12, 1, 'Lantai 12 - Kulkas 1'], [12, 2, 'Lantai 12 - Kulkas 2'],
];

let koneksi = null;

function db() {
  if (koneksi) return koneksi;
  fs.mkdirSync(path.join(config.FOLDER_DATA, 'uploads'), { recursive: true });
  koneksi = new DatabaseSync(path.join(config.FOLDER_DATA, 'chillguard.db'));
  koneksi.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  koneksi.exec(SKEMA);
  const ada = koneksi.prepare('SELECT COUNT(*) AS n FROM kulkas').get().n;
  if (ada === 0) isiDataAwal(koneksi);
  return koneksi;
}

function isiDataAwal(d) {
  const sekarang = Date.now();
  const waktu = (jam) => formatWib(sekarang + jam * 3600 * 1000);
  const hash = (teks) => bcrypt.hashSync(teks, 10);

  d.exec('BEGIN');
  const ik = d.prepare('INSERT INTO kulkas (lantai, nomor_kulkas, keterangan) VALUES (?, ?, ?)');
  KULKAS.forEach((k) => ik.run(...k));

  // Akun demo: admin123 dan pegawai123
  const ip = d.prepare('INSERT INTO pengguna (nama, email, password, role) VALUES (?, ?, ?, ?)');
  const hAdmin = hash('admin123');
  const hPegawai = hash('pegawai123');
  ip.run('Admin Chill Guard', 'admin@chillguard.local', hAdmin, 'admin');
  ip.run('Rudy Alpacino', 'rudy@chillguard.local', hPegawai, 'pegawai');
  ip.run('Anggita Adelia', 'anggita@chillguard.local', hPegawai, 'pegawai');
  ip.run('Muhammad Wildan Fauzi', 'wildan@chillguard.local', hPegawai, 'pegawai');

  // Makanan contoh (kulkas_id: 6 = lantai 5, 1 = lantai 2, 12 = lantai 10, 8 = lantai 7)
  const im = d.prepare(`INSERT INTO makanan (pengguna_id, kulkas_id, nama_makanan, deskripsi, tanggal_kadaluarsa, status, kondisi)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`);
  im.run(2, 6, 'Nasi Kotak', 'Nasi ayam dari rapat pagi', waktu(13), 'mendekati', 'aktif');
  im.run(2, 6, 'Yogurt Stroberi', 'Kemasan cup 150 ml', waktu(15 * 24), 'aman', 'aktif');
  im.run(3, 1, 'Roti Tawar', 'Sisa sarapan', waktu(2 * 24), 'mendekati', 'aktif');
  im.run(3, 12, 'Susu UHT Cokelat', null, waktu(40 * 24), 'aman', 'aktif');
  im.run(4, 8, 'Salad Buah', 'Dari acara kantor kemarin', waktu(-24), 'kadaluarsa', 'aktif');
  im.run(4, 8, 'Mie Instan Cup', null, waktu(90 * 24), 'aman', 'selesai');

  const iN = d.prepare("INSERT INTO notifikasi (pengguna_id, makanan_id, jenis, pesan) VALUES (?, ?, 'pengingat', ?)");
  iN.run(2, 1, 'Nasi Kotak di Lantai 5 mendekati kadaluarsa (sisa kurang dari 1 hari).');
  iN.run(3, 3, 'Roti Tawar di Lantai 2 mendekati kadaluarsa.');
  iN.run(4, 5, 'Salad Buah di Lantai 7 sudah kadaluarsa. Mohon segera diambil.');
  d.prepare("INSERT INTO log_aktivitas (pengguna_id, aksi, keterangan) VALUES (1, 'seed', 'Database contoh dibuat saat pertama kali dijalankan')").run();
  d.exec('COMMIT');
}

/** Semua baris hasil SELECT. */
function semua(sql, ...param) { return db().prepare(sql).all(...param); }
/** Satu baris (atau null). */
function satu(sql, ...param) { return db().prepare(sql).get(...param) ?? null; }
/** INSERT/UPDATE/DELETE: {changes, lastInsertRowid}. */
function jalankan(sql, ...param) {
  const r = db().prepare(sql).run(...param);
  return { changes: Number(r.changes), id: Number(r.lastInsertRowid) };
}
/** Transaksi sederhana. */
function transaksi(fn) {
  const d = db();
  d.exec('BEGIN');
  try { const hasil = fn(); d.exec('COMMIT'); return hasil; } catch (e) { d.exec('ROLLBACK'); throw e; }
}
function tutup() { if (koneksi) { koneksi.close(); koneksi = null; } }

/** Mencatat log aktivitas (dasar laporan logtime dan audit). */
function catatLog(penggunaId, aksi, keterangan = '') {
  jalankan('INSERT INTO log_aktivitas (pengguna_id, aksi, keterangan) VALUES (?, ?, ?)',
    penggunaId, aksi, String(keterangan).slice(0, 255));
}

module.exports = { db, semua, satu, jalankan, transaksi, tutup, catatLog };
