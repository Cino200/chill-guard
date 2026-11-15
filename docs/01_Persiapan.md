# 01. Persiapan: Apa yang Dibutuhkan

Versi portable ini sengaja dibuat sederhana: **tidak ada program yang harus diunduh** untuk menjalankan aplikasi web.
Semua yang diperlukan sudah ada di dalam zip.

## A. Untuk menjalankan aplikasi web (di komputer penilaian)

| Kebutuhan | Keterangan |
|-----------|------------|
| Windows 10 atau 11, 64-bit | Windows 7/8 tidak didukung oleh Node.js 22 |
| Browser (Chrome, Edge, Firefox) | Sudah ada di Windows (Edge) |
| Ruang flashdisk sekitar 150 MB | node.exe saja sekitar 87 MB |
| Hak Administrator | **Tidak perlu** |
| Internet | **Tidak perlu** (hanya untuk mencari nama produk dari barcode, opsional) |

Isi paket yang membuatnya jalan tanpa instalasi:
- `node\node.exe` : Node.js 22 untuk Windows 64-bit (menjalankan server dan memuat SQLite bawaan).
- `app\node_modules\` : dua pustaka murni JavaScript (`bcryptjs` untuk sandi, `busboy` untuk unggah foto). Tidak perlu `npm install`.
- Database SQLite dibuat otomatis di `data\chillguard.db`. Tidak ada server database yang perlu dipasang.

> Asal `node.exe`: diambil dari paket npm `node-win-x64` versi 22.23.4 (pengemasan ulang biner resmi Node.js).
> Bila ingin memakai berkas resmi, unduh **Windows Binary (.zip)** 64-bit dari https://nodejs.org/en/download lalu ganti `node\node.exe`
> dengan `node.exe` dari zip itu (versi 22.13 atau lebih baru; fitur `node:sqlite` yang dipakai tersedia sejak versi itu).

## B. Untuk aplikasi Android (di laptop pengembangan, bukan di kampus)

| Program | Kegunaan | Sumber |
|---------|----------|--------|
| Android Studio (terbaru) | Membuat `chillguard.apk` | https://developer.android.com/studio |
| HP Android 8.0 (API 26) atau lebih baru | Menjalankan aplikasi | - |

## C. Untuk kerja tim dan GitHub

| Program | Kegunaan | Sumber |
|---------|----------|--------|
| Git for Windows | Version control | https://git-scm.com/download/win |
| Akun GitHub | Repository, Pull Request, Projects | https://github.com |
| Node.js 22.13+ (opsional) | Hanya bila mengembangkan dari hasil `git clone` (zip sudah membawa node.exe) | https://nodejs.org |

## D. Daftar periksa

- [ ] Zip diekstrak ke flashdisk (mis. `E:\ChillGuard`) dan `start.bat` pernah dijalankan sekali
- [ ] Android Studio terpasang di laptop pengembangan
- [ ] Git terpasang dan akun GitHub siap

Lanjut ke [02. Menjalankan dari Flashdisk](02_Menjalankan-dari-Flashdisk.md).
