'use strict';
/** Aturan validasi inti (tanpa akses database agar mudah diuji). */
const { parseWib } = require('./waktu');

/**
 * Validasi form Tambah Makanan. Masukan: nama_makanan, kulkas_id, tanggal_kadaluarsa ("YYYY-MM-DD HH:MM").
 * Keputusan berurutan: 1 nama, 2 kulkas, 3 format tanggal, 4 tanggal lampau.
 */
function validasiTambahMakanan(masukan, sekarangMs) {
  const nama = String(masukan.nama_makanan ?? '').trim();
  if (nama === '') {                                                  // keputusan 1
    return { ok: false, kode: 'NAMA_KOSONG', pesan: 'Nama makanan wajib diisi' };
  }
  const kulkasId = parseInt(String(masukan.kulkas_id ?? '0'), 10) || 0;
  if (kulkasId <= 0) {                                                // keputusan 2
    return { ok: false, kode: 'KULKAS_KOSONG', pesan: 'Lantai/kulkas wajib dipilih' };
  }
  const teks = String(masukan.tanggal_kadaluarsa ?? '');
  const waktu = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(teks) ? parseWib(teks) : null;
  if (waktu === null) {                                               // keputusan 3
    return { ok: false, kode: 'FORMAT_TANGGAL', pesan: 'Format tanggal dan waktu tidak valid' };
  }
  if (Math.floor(waktu / 1000) < Math.floor(sekarangMs / 1000)) {     // keputusan 4
    return { ok: false, kode: 'TANGGAL_LALU', pesan: 'Tanggal kadaluarsa tidak boleh masa lalu' };
  }
  return { ok: true, kode: 'OK', pesan: 'Makanan berhasil ditambahkan' };
}

/**
 * Keputusan Hapus Akun (fitur tambahan).
 * akun: {role} atau null; jumlahAdmin; passwordBenar; dilakukanAdmin (true = tidak perlu password).
 */
function putuskanHapusAkun(akun, jumlahAdmin, passwordBenar, dilakukanAdmin) {
  if (akun === null || akun === undefined) {                          // keputusan 1
    return { ok: false, kode: 'AKUN_TIDAK_ADA', pesan: 'Akun tidak ditemukan' };
  }
  if (akun.role === 'admin' && jumlahAdmin <= 1) {                    // keputusan 2
    return { ok: false, kode: 'ADMIN_TERAKHIR', pesan: 'Admin terakhir tidak boleh dihapus' };
  }
  if (!dilakukanAdmin && !passwordBenar) {                            // keputusan 3
    return { ok: false, kode: 'PASSWORD_SALAH', pesan: 'Password konfirmasi salah' };
  }
  return { ok: true, kode: 'OK', pesan: 'Akun berhasil dihapus' };
}

module.exports = { validasiTambahMakanan, putuskanHapusAkun };
