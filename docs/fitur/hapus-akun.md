# Fitur: Hapus akun

## Tujuan
Pengguna dapat menghapus akunnya sendiri. Admin dapat menghapus akun pegawai.

## Kode terkait
- app/controllers/auth.js (fungsi `hapusAkun`)
- app/lib/validasi.js (fungsi `putuskanHapusAkun`, tiga keputusan)
- app/pages/pegawai.js (zona Hapus Akun pada halaman Profil)

## Aturan (tiga keputusan di `putuskanHapusAkun`)
1. Akun tidak ditemukan: ditolak (`AKUN_TIDAK_ADA`).
2. Admin terakhir: ditolak (`ADMIN_TERAKHIR`).
3. Dilakukan sendiri dan kata sandi konfirmasi salah: ditolak (`PASSWORD_SALAH`); admin yang menghapus tidak perlu kata sandi.
Bila lolos: makanan, notifikasi, dan chat milik akun ikut terhapus (relasi CASCADE); log aktivitas dipertahankan dengan pengguna dikosongkan.

## Cara uji
1. Masuk, buka menu Profil, bagian Hapus Akun.
2. Isi kata sandi salah: muncul pesan galat, akun tetap ada.
3. Isi kata sandi benar: akun dan datanya terhapus, sesi berakhir.
4. Otomatis: `node tests/jalankan-uji.js` (kelompok BB-HA, 6 kasus).
