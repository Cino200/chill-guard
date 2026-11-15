'use strict';
/** Notifikasi otomatis (pengingat H-1 / H-0), alarm dari Admin, dan penandaan dibaca. */
const { semua, satu, jalankan, catatLog } = require('../db');
const { formatWib } = require('../lib/waktu');
const makanan = require('./makanan');

/**
 * Membuat pengingat otomatis untuk makanan aktif yang sisa waktunya kurang dari 1 hari (H-1 dan H-0)
 * atau sudah kadaluarsa. Satu pengingat per makanan (tidak berulang).
 */
function buatPengingatOtomatis() {
  const sekarang = formatWib(Date.now());
  const besok = formatWib(Date.now() + 86400000);
  return jalankan(
    `INSERT INTO notifikasi (pengguna_id, makanan_id, jenis, pesan, tanggal_kirim)
     SELECT m.pengguna_id, m.id, 'pengingat',
            m.nama_makanan || ' di ' || k.keterangan ||
              CASE WHEN m.tanggal_kadaluarsa < ? THEN ' sudah kadaluarsa. Mohon segera diambil.'
                   ELSE ' akan kadaluarsa dalam kurang dari 1 hari.' END, ?
     FROM makanan m JOIN kulkas k ON k.id = m.kulkas_id
     WHERE m.kondisi = 'aktif' AND m.tanggal_kadaluarsa < ?
       AND NOT EXISTS (SELECT 1 FROM notifikasi n WHERE n.makanan_id = m.id AND n.jenis = 'pengingat')`,
    sekarang, sekarang, besok).changes;
}

const jumlahBelumDibaca = (penggunaId) =>
  satu('SELECT COUNT(*) AS n FROM notifikasi WHERE pengguna_id = ? AND dibaca = 0', penggunaId).n;

const daftar = (penggunaId, batas = 100) => semua(
  `SELECT id, makanan_id, jenis, pesan, dibaca, tanggal_kirim FROM notifikasi
   WHERE pengguna_id = ? ORDER BY tanggal_kirim DESC, id DESC LIMIT ${Number(batas) | 0}`, penggunaId);

function tandaiDibaca(penggunaId, id = null) {
  if (id === null) jalankan('UPDATE notifikasi SET dibaca = 1 WHERE pengguna_id = ?', penggunaId);
  else jalankan('UPDATE notifikasi SET dibaca = 1 WHERE pengguna_id = ? AND id = ?', penggunaId, id);
}

/** Admin mengirim alarm ke pemilik makanan. */
function kirimAlarmMakanan(makananId, pesanTambahan, admin) {
  const m = makanan.ambil(makananId);
  if (!m) return { ok: false, pesan: 'Makanan tidak ditemukan.' };
  const pesan = `ALARM ADMIN: ${m.nama_makanan} di ${m.nama_kulkas} (${m.teks_sisa}). ${String(pesanTambahan ?? '').trim()}`.trim();
  jalankan("INSERT INTO notifikasi (pengguna_id, makanan_id, jenis, pesan, tanggal_kirim) VALUES (?, ?, 'alarm_admin', ?, ?)",
    m.pengguna_id, makananId, pesan.slice(0, 255), formatWib(Date.now()));
  catatLog(admin.id, 'kirim_alarm', `${m.nama_makanan} -> ${m.nama_pemilik}`);
  return { ok: true, pesan: `Alarm terkirim ke ${m.nama_pemilik}.` };
}

/** Admin mengirim pesan alarm bebas ke seorang pegawai atau semua pegawai (penerimaId = 0). */
function kirimAlarmUmum(penerimaId, pesan, admin) {
  pesan = String(pesan ?? '').trim();
  if (pesan === '') return { ok: false, pesan: 'Isi pesan alarm wajib diisi.' };
  pesan = ('ALARM ADMIN: ' + pesan).slice(0, 255);
  const waktu = formatWib(Date.now());
  let jumlah;
  if (penerimaId === 0) {
    jumlah = jalankan("INSERT INTO notifikasi (pengguna_id, jenis, pesan, tanggal_kirim) SELECT id, 'alarm_admin', ?, ? FROM pengguna WHERE role = 'pegawai'",
      pesan, waktu).changes;
  } else {
    if (!satu("SELECT id FROM pengguna WHERE id = ? AND role = 'pegawai'", penerimaId)) return { ok: false, pesan: 'Penerima tidak ditemukan.' };
    jumlah = jalankan("INSERT INTO notifikasi (pengguna_id, jenis, pesan, tanggal_kirim) VALUES (?, 'alarm_admin', ?, ?)",
      penerimaId, pesan, waktu).changes;
  }
  catatLog(admin.id, 'kirim_alarm', 'umum, penerima: ' + (penerimaId === 0 ? 'semua pegawai' : penerimaId));
  return { ok: true, pesan: `Alarm dikirim ke ${jumlah} penerima.` };
}

module.exports = { buatPengingatOtomatis, jumlahBelumDibaca, daftar, tandaiDibaca, kirimAlarmMakanan, kirimAlarmUmum };
