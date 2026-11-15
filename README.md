# Chill Guard

Sistem cerdas penyimpanan makanan pada kulkas untuk Direktorat Jenderal Perimbangan Keuangan (DJPK).
Aplikasi web (Node.js + SQLite) dan aplikasi Android (WebView + scan barcode). Mata kuliah Rekayasa Perangkat Lunak, UNINDRA.

**Tim:** Rudy Alpacino (202343501300), Anggita Adelia (202343501206), Muhammad Wildan Fauzi (202343501286)

## Fitur
- Pegawai: daftar makanan berwarna (Aman / Mendekati / Kadaluarsa) terurut prioritas, tambah/ubah/hapus, foto, barcode, pengingat, chat ke admin, hapus akun.
- Admin: pantau 17 kulkas di 10 lantai, kirim alarm, recycle bin, kelola pengguna, laporan logtime (CSV/cetak).

## Menjalankan (Windows, portable)
1. Ekstrak zip ke flashdisk atau folder mana pun.
2. Klik dua kali `start.bat`, lalu buka `http://localhost:8080/`.
3. Cek sistem: `http://localhost:8080/cek`.
4. Demo: `admin@chillguard.local` / `admin123`, `rudy@chillguard.local` / `pegawai123`.

Dari clone GitHub (tanpa `node\`): pasang Node.js 22.13+ lalu `cd app && npm install`, kemudian `node server.js`.

## Struktur
```
app/         server, halaman, controller, database (Node.js)
tests/       uji black-box dan white-box (node tests/jalankan-uji.js)
android/     proyek Android Studio
docs/        panduan 01-08
start.bat    jalankan server
```

## Aturan tim
- Satu branch per fitur, Pull Request wajib di-review.
- Jangan meng-commit `data/`, `node/`, `app/node_modules/`, `.apk`, dan `.zip` (pakai GitHub Releases).
