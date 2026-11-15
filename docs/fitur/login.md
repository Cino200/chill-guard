# Fitur: Masuk (login)

## Tujuan
Pengguna masuk memakai email dan kata sandi. Sesi berakhir otomatis setelah 30 menit tidak aktif.

## Kode terkait
- app/controllers/auth.js (fungsi `login`, `registrasi`)
- app/pages/auth.js (halaman Masuk dan Daftar)
- app/server.js (sesi di memori dan token CSRF pada setiap POST)

## Aturan
- Kata sandi disimpan sebagai hash bcrypt; tidak pernah disimpan apa adanya.
- Kata sandi minimal 6 karakter saat mendaftar.
- Form POST ditolak bila token CSRF tidak cocok.

## Cara uji
1. Buka http://localhost:8080/masuk
2. Masuk dengan rudy@chillguard.local / pegawai123: tampil halaman Makanan Saya.
3. Masukkan kata sandi salah: muncul pesan galat dan tidak masuk.
