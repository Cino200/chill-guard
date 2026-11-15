# 08. ZIP Final dan Persiapan Penilaian di Kampus

Tujuan: satu folder/zip `ChillGuard-Portable` yang bila diekstrak ke flashdisk (E:) di komputer Windows 10/11 mana pun,
lalu `start.bat` diklik, langsung berjalan, ditambah `chillguard.apk` untuk Android.

## A. Sebelum mengemas (daftar periksa)

- [ ] `start.bat` dijalankan dari **flashdisk E:** dan `http://localhost:8080/cek` semua **OK**
- [ ] Alur utama dicoba: login, tambah makanan, lihat status, hapus akun uji
- [ ] `jalankan-uji.bat` menampilkan **31 PASS, 0 FAIL**
- [ ] Tabel uji manual di [06](06_Pengujian-BlackBox-WhiteBox.md) sudah diisi
- [ ] `android\chillguard.apk` sudah ada ([04](04_Aplikasi-Android.md))
- [ ] `reset-data.bat` dijalankan agar data demo bersih (atau hapus folder `data\`)
- [ ] Semua perubahan sudah di-push ke GitHub dan `main` sudah dirilis ([05](05_Panduan-GitHub.md))
- [ ] Jendela server ditutup

## B. Membuat zip

1. Tutup server. Hapus folder `data\` (database kerja dan foto uji) agar zip bersih.
2. Klik kanan folder `ChillGuard` > **Send to > Compressed (zipped) folder**, atau gunakan 7-Zip (format zip).
3. Ukuran wajar: sekitar 35 MB (node.exe terkompresi). Periksa dengan membuka zip: **tidak boleh** ada folder `data\`.
4. Simpan zip ini sebagai cadangan, dan salinan folder yang sudah diekstrak di flashdisk E:.

## C. Struktur akhir yang dibawa

```
ChillGuard\
├─ MULAI-DI-SINI.txt   start.bat  reset-data.bat  jalankan-uji.bat  buka-firewall.bat
├─ node\node.exe       program satu-satunya
├─ app\                kode web + node_modules
├─ android\            proyek + chillguard.apk (hasil build Anda)
├─ tests\  docs\  Panduan-Lengkap.pdf
```
Bawa juga: **cadangan kedua** (flashdisk lain atau Google Drive), kabel USB, dan charger.

## D. Uji di komputer lain (WAJIB, minimal sekali, H-3 sebelum penilaian)

Idealnya di laptop yang tidak pernah memasang Node.js, atau di Windows Sandbox.

1. Colok flashdisk (mis. jadi `E:`), buka `E:\ChillGuard`.
2. Klik dua kali `start.bat`. Tunggu **CHILL GUARD BERJALAN**.
3. Buka `http://localhost:8080/cek`: semua OK.
4. Login admin dan pegawai, tambah makanan, lihat status, hapus akun uji.
5. Sambungkan HP lewat hotspot, pasang APK, login dari HP, scan barcode.
6. Jalankan `jalankan-uji.bat`: 0 FAIL.
7. Tutup server, jalankan `start.bat` lagi: data tetap ada.
8. Catat setiap masalah dan perbaiki di repo, buat zip ulang.

## E. Perlengkapan hari penilaian

| Barang | Catatan |
|--------|---------|
| Laptop Windows terisi daya + charger | Pakai laptop sendiri bila bisa; **tidak perlu** hak admin |
| Flashdisk (E:) berisi folder yang sudah teruji | Plus zip cadangan |
| HP Android dengan APK terpasang | Baterai penuh, izin kamera sudah diberikan |
| Kuota/hotspot HP | Untuk jaringan lokal dan lookup barcode |
| Video demo 2-3 menit | Rencana C bila semuanya gagal |
| Cetak/pdf dokumen Tugas 1-13 | Sesuai permintaan dosen |
| Produk berbarcode (dua atau tiga kemasan) | Untuk demo scan |
| Tangkapan layar GitHub | Repo, PR, Projects |

## F. Skrip demo (sekitar 8-10 menit)

| Menit | Kegiatan | Menyentuh Tugas |
|-------|----------|-----------------|
| 0-1 | Tunjukkan satu folder di flashdisk, tidak ada instalasi. Klik `start.bat` | Portabilitas |
| 1-2 | `/cek`: server, database, 17 kulkas | Tugas 10 |
| 2-4 | Login Pegawai: tambah makanan (foto, tanggal), lihat kartu berwarna dan urutan prioritas | Tugas 3-5, 10 |
| 4-5 | Ubah tanggal untuk menunjukkan status Aman, Mendekati, Kadaluarsa; notifikasi dan banner | Tugas 5 |
| 5-6 | HP: buka aplikasi Android, scan barcode | Tugas 7, 9 |
| 6-7 | Daftar akun baru lalu **Hapus Akun**; tunjukkan data ikut terhapus | Fitur tambahan |
| 7-8 | Login Admin: pantau per lantai, alarm, recycle bin, laporan | Tugas 3-4 |
| 8-9 | Buka `jalankan-uji.bat`: 31 PASS, cakupan 100% | Tugas 12 |
| 9-10 | Tunjukkan GitHub: branch, PR, review, Projects | Tugas 11, 13 |

Pembagian bicara: Rudy (portabilitas, login, hapus akun, uji), Anggita (daftar makanan, notifikasi, admin), Wildan (tambah makanan, Android, scan).

## G. Rencana cadangan

| Situasi | Tindakan |
|---------|----------|
| `start.bat` diblokir / berkedip hilang | Perintah manual di [02](02_Menjalankan-dari-Flashdisk.md) (bagian "perintah manual") |
| Antivirus memblokir `node.exe` | Pulihkan dari karantina/izinkan folder, atau ganti dengan `node.exe` resmi nodejs.org |
| Port bentrok | Otomatis pindah ke 8081 dst; baca alamat di jendela server |
| Komputer kampus tidak boleh menjalankan program | Pakai laptop sendiri, layar dihubungkan ke proyektor |
| Wi-Fi kampus memblokir HP | Hotspot HP (laptop terhubung ke hotspot itu) |
| HP tidak bisa terhubung sama sekali | Demo web di laptop; Android di emulator (`10.0.2.2`) atau video |
| Database rusak | `reset-data.bat` lalu `start.bat` |
| Semua gagal | Putar video demo dan tunjukkan kode, uji, dan GitHub |

## H. Pertanyaan yang mungkin diajukan dosen

| Pertanyaan | Jawaban singkat |
|------------|-----------------|
| Mengapa web + Android WebView? | Satu basis kode, pembaruan cukup di server; Android menambah kamera/scan (Tugas 9) |
| Mengapa Node.js + SQLite, bukan Apache/PHP/MySQL seperti Tugas 7? | Agar portable: satu program, tanpa instalasi dan tanpa server database terpisah. Skema dan aturan bisnis sama; untuk produksi dapat dipindah ke server + MySQL |
| Bagaimana status dihitung? | `tentukanStatus`: sisa < 0 Kadaluarsa; ≤ 3 hari Mendekati; selebihnya Aman |
| Bagaimana keamanan kata sandi? | bcrypt, kueri berparameter, sesi 30 menit, token CSRF |
| Teknik black-box apa yang dipakai? | EP, BVA, decision table (Modul 12) |
| Cakupan white-box? | Branch 100% pada tiga fungsi inti, dihitung dari 31 kasus uji |
| Apa yang terjadi pada data saat akun dihapus? | `ON DELETE CASCADE`; log audit tetap (`SET NULL`) |
| Mengapa HTTP, bukan HTTPS? | Jaringan lokal demonstrasi; HTTPS untuk produksi sesuai rancangan Tugas 7 |
| Siapa mengerjakan apa? | Lihat RACI di [07](07_Manajemen-Proyek.md) dan riwayat commit/PR |

Selesai. Semoga lancar saat penilaian.
