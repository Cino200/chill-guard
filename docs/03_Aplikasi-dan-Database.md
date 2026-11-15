# 03. Aplikasi Web dan Database (Tugas 10: Konstruksi)

Aplikasi web Chill Guard **sudah lengkap** di folder `app\` (Node.js 22, tanpa framework, SQLite bawaan Node). Bagian ini menjelaskan
isi, struktur, dan aturan kodenya agar dapat dipertanggungjawabkan saat penilaian, dan dipetakan ke diagram Tugas 3-7 dan 9.

> Catatan konsistensi dokumen: rancangan Tugas 7 (Deployment Diagram) menggambarkan web server dan database MySQL terpisah.
> Implementasi portable memakai **Node.js + SQLite dalam satu proses** agar bisa berjalan dari flashdisk tanpa instalasi.
> Skema tabel, relasi, dan aturan bisnisnya sama; hanya mesin database dan web servernya yang berbeda. Sebutkan ini bila dosen menanyakan.

Telah diuji otomatis: 86 pemeriksaan alur dan 31 kasus uji unit lulus semua (lihat [06](06_Pengujian-BlackBox-WhiteBox.md)).

## Fitur yang sudah ada

| Peran | Fitur |
|-------|-------|
| Semua | Registrasi (pegawai), login/logout, sesi habis 30 menit, kata sandi bcrypt, token CSRF |
| Pegawai | Dashboard kartu berwarna (Aman/Mendekati/Kadaluarsa) terurut prioritas, cari dan filter, tambah/ubah makanan (foto JPG/PNG maks. 2 MB, barcode, scan di Android), tandai selesai, hapus (Recycle Bin), banner H-1/H-0, notifikasi, live chat ke Admin, **hapus akun** |
| Admin | Pantau semua makanan per lantai (10 lantai, 17 kulkas), kirim alarm (per makanan atau umum), Recycle Bin (pulihkan/hapus permanen), kelola pengguna (ubah peran, hapus akun), laporan logtime (CSV dan cetak/PDF), live chat, log aktivitas |

## 1. Database

Berkas: `data\chillguard.db` (SQLite). Skema ada di `app\db.js` (konstanta `SKEMA`) dan dibuat otomatis beserta data contoh saat server pertama kali jalan.

| Tabel | Kelas pada Class Diagram | Isi utama |
|-------|--------------------------|-----------|
| `pengguna` | Pengguna / Pegawai / Admin | nama, email (unik), password (bcrypt), role `admin`/`pegawai` |
| `kulkas` | Kulkas | lantai, nomor_kulkas (17 baris: lantai 2,3,4,5,7,8,9,10,11,12) |
| `makanan` | Makanan | nama, deskripsi, barcode, foto, tanggal_kadaluarsa, status, kondisi (`aktif`/`selesai`/`dihapus`), dibuat_pada (logtime) |
| `notifikasi` | Notifikasi | jenis `pengingat`/`alarm_admin`, pesan, dibaca |
| `chat` | Live chat | pengirim, penerima, pesan |
| `log_aktivitas` | Laporan logtime | aksi, keterangan, waktu |

Aturan penting:
- `makanan.pengguna_id` memakai `ON DELETE CASCADE`: **hapus akun otomatis menghapus makanan, notifikasi, dan chat akun itu**.
- `log_aktivitas.pengguna_id` memakai `ON DELETE SET NULL`: catatan audit tetap ada walau akun dihapus.
- `makanan.kulkas_id` memakai `ON DELETE RESTRICT`: kulkas yang masih berisi makanan tidak boleh dihapus.
- Foreign key SQLite diaktifkan per koneksi (`PRAGMA foreign_keys = ON`).
- Status disimpan di kolom `status`, tetapi **selalu dihitung ulang dari `tanggal_kadaluarsa`** saat ditampilkan.
- Semua waktu disimpan sebagai teks WIB `YYYY-MM-DD HH:MM:SS`, sehingga tidak bergantung zona waktu Windows.

### Akun demo

| Peran | Email | Kata sandi |
|-------|-------|------------|
| Admin | `admin@chillguard.local` | `admin123` |
| Pegawai | `rudy@chillguard.local`, `anggita@chillguard.local`, `wildan@chillguard.local` | `pegawai123` |

Ganti kata sandi demo bila aplikasi dipakai di luar demonstrasi.

### Melihat isi database

Cara paling mudah: jalankan skrip satu baris dari folder `ChillGuard` (Command Prompt):
```
node\node.exe -e "const{DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('data/chillguard.db');console.table(d.prepare('SELECT id,nama,role FROM pengguna').all())"
```
Atau unduh **DB Browser for SQLite** (https://sqlitebrowser.org, versi portable tersedia) dan buka `data\chillguard.db`. Opsional.

## 2. Struktur folder `app\` (mengikuti Tugas 10)

```
app\
├─ server.js            router, sesi, CSRF, pembaca form/unggahan, berkas statis, pemilihan port
├─ config.js            konstanta (port, lokasi data, batas foto, batas sesi)
├─ db.js                koneksi SQLite, skema, data contoh, fungsi bantu kueri (parameter terikat)
├─ lib\
│  ├─ waktu.js          hitungSisaDetik, tentukanStatus, formatSisaWaktu, urutkanPrioritas   (fungsi murni)
│  ├─ validasi.js       validasiTambahMakanan, putuskanHapusAkun                              (fungsi murni)
│  └─ tampilan.js       escape HTML, kerangka halaman, kartu makanan, formulir
├─ controllers\         auth, makanan, notifikasi, chat, admin  (aksi: kueri + aturan bisnis)
├─ pages\               auth, makanan, pegawai, admin, cek      (satu fungsi per halaman)
└─ public\              css\app.css, js\app.js
```
Pola yang dipakai: **fungsi murni** (keputusan, mudah diuji) di `lib\`, **aksi** (kueri, berkas) di `controllers\`, **tampilan** di `pages\`.

Daftar alamat: `/masuk`, `/daftar`, `/keluar`, `/dashboard`, `/makanan/tambah`, `/makanan/ubah?id=`, `/makanan/aksi` (POST), `/profil`,
`/notifikasi`, `/chat`, `/admin`, `/admin/alarm`, `/admin/sampah`, `/admin/pengguna`, `/admin/laporan`, `/cek`.

## 3. Standar penamaan dan prinsip (Modul 10)

- Variabel/fungsi: **camelCase** dan deskriptif (`hitungSisaDetik`, `tanggalKadaluarsa`). Konstanta: HURUF_BESAR (`SESI_TIMEOUT_MS`).
- Tabel/kolom database: huruf kecil dengan garis bawah. Nama berkas: huruf kecil.
- **DRY**: perhitungan status hanya di `lib\waktu.js`; semua halaman memanggilnya.
- **KISS**: satu fungsi, satu tugas. Keputusan dipisah dari aksi.
- Komentar menjelaskan *mengapa*, bukan mengulang kode.

## 4. Aturan bisnis yang harus identik di web dan Android

| Aturan | Implementasi |
|--------|--------------|
| Status | `sisa < 0` Kadaluarsa; `0 <= sisa <= 3 hari` Mendekati; lebih dari 3 hari Aman (`tentukanStatus`) |
| Tampilan sisa | "Sisa 13 Jam" bila kurang dari 1 hari, "Sisa 15 Hari" bila 1 hari atau lebih, "Kadaluarsa" bila lewat (`formatSisaWaktu`) |
| Urutan | Yang paling mendesak di atas (`urutkanPrioritas`) |
| Kode warna | Aman hijau, Mendekati kuning/oranye, Kadaluarsa merah |
| Pengingat | Notifikasi + banner saat sisa kurang dari 1 hari (H-1 dan H-0), dibuat sekali per makanan |
| Foto | JPG/PNG maks. 2 MB; tipe diperiksa dari isi berkas (magic bytes), bukan ekstensi; disimpan dengan nama acak |
| Kata sandi | bcrypt (`bcryptjs`, cost 10) |
| Sesi | Habis setelah 30 menit tidak aktif; ID sesi diganti saat login dan logout |
| SQL | **Selalu** parameter terikat (`?`); tidak pernah menyambung string kueri dengan input pengguna |
| Keluaran HTML | Fungsi `e()` meng-escape semua teks dari pengguna |
| Hak akses | Halaman Admin memanggil `wajibAdmin()`; Pegawai hanya melihat dan mengubah makanan miliknya |

## 5. Fitur Hapus Akun (fitur tambahan)

Alur:
1. Pegawai membuka **Profil > Hapus Akun**; muncul peringatan bahwa makanan, notifikasi, dan chat ikut terhapus permanen.
2. Pegawai mengisi **kata sandi** sebagai konfirmasi, lalu menekan **Hapus Akun Saya**.
3. Server memanggil `putuskanHapusAkun(akun, jumlahAdmin, passwordBenar, dilakukanAdmin)`:

| Kode | Arti | Tindakan |
|------|------|----------|
| `AKUN_TIDAK_ADA` | ID tidak ditemukan | pesan error |
| `ADMIN_TERAKHIR` | akun admin satu-satunya | tolak (sistem tidak boleh tanpa admin) |
| `PASSWORD_SALAH` | pegawai salah kata sandi | tolak |
| `OK` | boleh dihapus | lanjut |

4. Jika `OK`: ambil nama foto, jalankan `DELETE FROM pengguna WHERE id = ?` (relasi `CASCADE` membersihkan data terkait), hapus berkas foto,
   tulis `log_aktivitas` (aksi `hapus_akun`, `pengguna_id` NULL), akhiri sesi, lalu arahkan ke halaman login.
5. Admin dapat menghapus akun pegawai dari panel Admin tanpa kata sandi pegawai. Admin yang menghapus akunnya **sendiri** tetap wajib memasukkan kata sandi.

## 6. Scan barcode: jembatan Android dan pencarian nama produk

Di `public\js\app.js` dan formulir pada `lib\tampilan.js`:
- Tombol **Scan** memanggil `AndroidApp.scanBarcode()` (hanya ada di aplikasi Android); hasilnya dikembalikan ke `window.onBarcodeScanned(kode)`.
- Nama produk dicari di **Open Food Facts** dari browser/WebView (butuh internet di perangkat). Bila gagal, kolom nama diisi manual.
- Tautan **Pengaturan Server** di halaman Masuk muncul hanya di aplikasi Android.
- Di browser biasa, tombol Scan menampilkan petunjuk: isi barcode manual.

## 7. Mengembangkan lebih lanjut (per branch)

Gunakan branch per fitur ([05](05_Panduan-GitHub.md)): `feature/login`, `feature/tambah-makanan`, `feature/daftar-makanan`, `feature/hapus-akun`,
`feature/admin-panel`, `feature/android`. Setiap perubahan: jalankan `jalankan-uji.bat`, uji manual dengan tabel di [06](06_Pengujian-BlackBox-WhiteBox.md), lalu Pull Request.

Keamanan yang sudah diterapkan: parameter terikat di semua kueri, escape semua keluaran, token CSRF pada semua POST, logout lewat POST,
tipe foto dari isi berkas dan nama acak, hanya nama acak yang dapat diakses lewat `/uploads/`, CSV dilindungi dari rumus berbahaya,
pesan login tidak membocorkan email terdaftar, hak akses diperiksa di server.

Lanjut ke [04. Aplikasi Android](04_Aplikasi-Android.md).
