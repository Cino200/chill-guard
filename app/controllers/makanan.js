'use strict';
/** Pengelolaan makanan: tambah, ubah, hapus, selesai, pulihkan, daftar dan status. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { semua, satu, jalankan, catatLog } = require('../db');
const { formatWib, parseWib, hitungSisaDetik, tentukanStatus, formatSisaWaktu, urutkanPrioritas } = require('../lib/waktu');
const { validasiTambahMakanan } = require('../lib/validasi');

const KOLOM = `m.id, m.pengguna_id, m.kulkas_id, m.nama_makanan, m.deskripsi, m.barcode, m.foto,
  m.tanggal_kadaluarsa, m.status, m.kondisi, m.dibuat_pada, m.dihapus_pada,
  k.lantai, k.nomor_kulkas, k.keterangan AS nama_kulkas, p.nama AS nama_pemilik`;
const DARI = `FROM makanan m JOIN kulkas k ON k.id = m.kulkas_id JOIN pengguna p ON p.id = m.pengguna_id`;

/** Menambah sisa_detik, status_baru (dihitung ulang) dan teks_sisa pada tiap baris. */
function perkaya(baris) {
  const sekarang = Date.now();
  return baris.map((b) => {
    const sisa = hitungSisaDetik(b.tanggal_kadaluarsa, sekarang);
    return { ...b, sisa_detik: sisa, status_baru: tentukanStatus(sisa), teks_sisa: formatSisaWaktu(sisa) };
  });
}

/** Menyimpan status terbaru ke database bila berubah (status selalu dihitung dari tanggal). */
function sinkronkanStatus(baris) {
  return baris.map((b) => {
    if (b.status !== b.status_baru && b.kondisi === 'aktif') {
      jalankan('UPDATE makanan SET status = ? WHERE id = ?', b.status_baru, b.id);
    }
    return { ...b, status: b.status_baru };
  });
}

function saring(baris, cari, filter) {
  const kata = String(cari || '').trim().toLowerCase();
  return baris.filter((b) => {
    if (filter && b.status !== filter) return false;
    if (!kata) return true;
    const gudang = [b.nama_makanan, b.deskripsi, b.barcode, b.nama_pemilik].map((x) => x || '').join(' ').toLowerCase();
    return gudang.includes(kata);
  });
}

function daftarMilik(penggunaId, cari = '', filter = '') {
  const baris = semua(`SELECT ${KOLOM} ${DARI} WHERE m.pengguna_id = ? AND m.kondisi = 'aktif'`, penggunaId);
  return saring(urutkanPrioritas(sinkronkanStatus(perkaya(baris))), cari, filter);
}

function daftarSemua(lantai = 0, cari = '', filter = '') {
  let sql = `SELECT ${KOLOM} ${DARI} WHERE m.kondisi = 'aktif'`;
  const param = [];
  if (lantai > 0) { sql += ' AND k.lantai = ?'; param.push(lantai); }
  const baris = semua(sql, ...param);
  return saring(urutkanPrioritas(sinkronkanStatus(perkaya(baris))), cari, filter);
}

function ringkasan(baris) {
  const hasil = { aman: 0, mendekati: 0, kadaluarsa: 0 };
  baris.forEach((b) => { hasil[b.status] += 1; });
  return hasil;
}

function ambil(id) {
  const baris = semua(`SELECT ${KOLOM} ${DARI} WHERE m.id = ?`, id);
  return baris.length ? perkaya(baris)[0] : null;
}

/** Makanan boleh diubah oleh pemilik atau admin. */
function ambilBoleh(id, pengguna) {
  const m = ambil(id);
  if (!m) return null;
  if (pengguna.role !== 'admin' && m.pengguna_id !== pengguna.id) return null;
  return m;
}

function daftarKulkas() {
  return semua('SELECT id, lantai, nomor_kulkas, keterangan FROM kulkas ORDER BY lantai, nomor_kulkas');
}

const kulkasAda = (id) => satu('SELECT id FROM kulkas WHERE id = ?', id) !== null;
function kosongJadiNull(teks, maks) {
  const t = String(teks ?? '').trim();
  return t === '' ? null : t.slice(0, maks);
}

// ------------------------------------------------------------------ foto
/** Tipe foto dikenali dari ISI berkas (magic bytes), bukan dari ekstensi atau Content-Type. */
function kenaliGambar(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  return null;
}

/** Memeriksa dan menyimpan foto (JPG/PNG maks. 2 MB). Mengembalikan {} bila tidak ada foto. */
function simpanFoto(berkas) {
  if (!berkas || (berkas.nama === '' && berkas.buffer.length === 0)) return {};
  if (berkas.terpotong || berkas.buffer.length > config.FOTO_MAKS_BYTE) return { galat: 'Ukuran foto maksimal 2 MB.' };
  if (berkas.buffer.length === 0) return { galat: 'Foto gagal diunggah. Coba lagi.' };
  const ekstensi = kenaliGambar(berkas.buffer);
  if (!ekstensi) return { galat: 'Format foto harus JPG atau PNG.' };
  fs.mkdirSync(path.join(config.FOLDER_DATA, 'uploads'), { recursive: true });
  const nama = crypto.randomBytes(16).toString('hex') + '.' + ekstensi;
  fs.writeFileSync(path.join(config.FOLDER_DATA, 'uploads', nama), berkas.buffer);
  return { nama };
}

function hapusBerkasFoto(nama) {
  // Hanya nama acak buatan sistem yang boleh dihapus (cegah path traversal)
  if (nama && /^[a-f0-9]{32}\.(jpg|png)$/.test(nama)) {
    try { fs.unlinkSync(path.join(config.FOLDER_DATA, 'uploads', nama)); } catch { /* sudah tidak ada */ }
  }
}

// ---------------------------------------------------------------- aksi
function tambah(penggunaId, post, berkas) {
  const data = { ...post, tanggal_kadaluarsa: String(post.tanggal_kadaluarsa ?? '').replace('T', ' ') };
  const hasil = validasiTambahMakanan(data, Date.now());
  if (!hasil.ok) return hasil;
  if (!kulkasAda(parseInt(data.kulkas_id, 10))) return { ok: false, kode: 'KULKAS_KOSONG', pesan: 'Kulkas tidak ditemukan' };

  const foto = simpanFoto(berkas.foto);
  if (foto.galat) return { ok: false, kode: 'FOTO', pesan: foto.galat };

  const kadaluarsa = data.tanggal_kadaluarsa + ':00';
  const status = tentukanStatus(hitungSisaDetik(kadaluarsa));
  jalankan(
    `INSERT INTO makanan (pengguna_id, kulkas_id, nama_makanan, deskripsi, barcode, foto, tanggal_kadaluarsa, status, dibuat_pada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    penggunaId, parseInt(data.kulkas_id, 10), String(data.nama_makanan).trim().slice(0, 100),
    kosongJadiNull(data.deskripsi, 2000), kosongJadiNull(data.barcode, 64), foto.nama ?? null,
    kadaluarsa, status, formatWib(Date.now()));
  catatLog(penggunaId, 'tambah_makanan', String(data.nama_makanan).trim());
  return hasil;
}

function ubah(id, pengguna, post, berkas) {
  const lama = ambilBoleh(id, pengguna);
  if (!lama || lama.kondisi !== 'aktif') {
    return { ok: false, kode: 'TIDAK_ADA', pesan: 'Makanan tidak ditemukan atau bukan milik Anda' };
  }
  const data = { ...post, tanggal_kadaluarsa: String(post.tanggal_kadaluarsa ?? '').replace('T', ' ') };
  // Tanggal yang tidak diubah tetap boleh walau sudah lewat
  const batas = Math.min(Date.now(), parseWib(lama.tanggal_kadaluarsa));
  const hasil = validasiTambahMakanan(data, batas);
  if (!hasil.ok) return hasil;
  if (!kulkasAda(parseInt(data.kulkas_id, 10))) return { ok: false, kode: 'KULKAS_KOSONG', pesan: 'Kulkas tidak ditemukan' };

  const foto = simpanFoto(berkas.foto);
  if (foto.galat) return { ok: false, kode: 'FOTO', pesan: foto.galat };
  let namaFoto = lama.foto;
  if (foto.nama) { hapusBerkasFoto(lama.foto); namaFoto = foto.nama; }

  const kadaluarsa = data.tanggal_kadaluarsa + ':00';
  jalankan(
    `UPDATE makanan SET kulkas_id = ?, nama_makanan = ?, deskripsi = ?, barcode = ?, foto = ?,
            tanggal_kadaluarsa = ?, status = ? WHERE id = ?`,
    parseInt(data.kulkas_id, 10), String(data.nama_makanan).trim().slice(0, 100),
    kosongJadiNull(data.deskripsi, 2000), kosongJadiNull(data.barcode, 64), namaFoto,
    kadaluarsa, tentukanStatus(hitungSisaDetik(kadaluarsa)), id);
  // Tanggal berubah: pengingat lama tidak berlaku lagi, boleh dibuat ulang
  if (kadaluarsa !== lama.tanggal_kadaluarsa) {
    jalankan("DELETE FROM notifikasi WHERE makanan_id = ? AND jenis = 'pengingat'", id);
  }
  catatLog(pengguna.id, 'ubah_makanan', String(data.nama_makanan).trim());
  return { ok: true, kode: 'OK', pesan: 'Makanan berhasil diperbarui' };
}

/** Hapus lunak: masuk Recycle Bin. */
function hapus(id, pengguna) {
  const m = ambilBoleh(id, pengguna);
  if (!m || m.kondisi !== 'aktif') return false;
  jalankan("UPDATE makanan SET kondisi = 'dihapus', dihapus_pada = ? WHERE id = ?", formatWib(Date.now()), id);
  catatLog(pengguna.id, 'hapus_makanan', m.nama_makanan);
  return true;
}

/** Tandai sudah diambil/dikonsumsi. */
function selesai(id, pengguna) {
  const m = ambilBoleh(id, pengguna);
  if (!m || m.kondisi !== 'aktif') return false;
  jalankan("UPDATE makanan SET kondisi = 'selesai' WHERE id = ?", id);
  catatLog(pengguna.id, 'selesai_makanan', m.nama_makanan);
  return true;
}

function daftarSampah() {
  return perkaya(semua(`SELECT ${KOLOM} ${DARI} WHERE m.kondisi = 'dihapus' ORDER BY m.dihapus_pada DESC`));
}

function pulihkan(id, admin) {
  const r = jalankan("UPDATE makanan SET kondisi = 'aktif', dihapus_pada = NULL WHERE id = ? AND kondisi = 'dihapus'", id);
  if (r.changes > 0) catatLog(admin.id, 'pulihkan_makanan', 'id ' + id);
  return r.changes > 0;
}

function hapusPermanen(id, admin) {
  const m = satu("SELECT nama_makanan, foto FROM makanan WHERE id = ? AND kondisi = 'dihapus'", id);
  if (!m) return false;
  jalankan('DELETE FROM makanan WHERE id = ?', id);
  hapusBerkasFoto(m.foto);
  catatLog(admin.id, 'hapus_permanen', m.nama_makanan);
  return true;
}

module.exports = {
  perkaya, daftarMilik, daftarSemua, ringkasan, ambil, daftarKulkas, tambah, ubah, hapus, selesai,
  daftarSampah, pulihkan, hapusPermanen, simpanFoto, hapusBerkasFoto, kenaliGambar,
};
