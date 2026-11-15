# 06. Pengujian Black-Box dan White-Box (Tugas 12)

| | Black-box | White-box |
|---|-----------|-----------|
| Dasar | Spesifikasi (SRS, use case, tampilan) | Struktur kode (percabangan, jalur, perulangan) |
| Penguji melihat kode? | Tidak | Ya |
| Teknik | Equivalence Partitioning, Boundary Value Analysis, Decision Table | Statement, Branch, Path, Loop coverage |
| Sasaran | Fungsi memenuhi kebutuhan | Setiap jalur logika teruji |
| Di Chill Guard | Uji tampilan web/Android per fitur | Uji fungsi `tentukanStatus`, `validasiTambahMakanan`, `putuskanHapusAkun` |

Kit ini sudah menyertakan skrip uji otomatis (`jalankan-uji.bat`) yang menjalankan kasus uji fungsi inti dan menghitung cakupan percabangan.
Uji tampilan (formulir, tombol, scan) dilakukan manual memakai tabel di bawah dan hasilnya Anda isi.

---

## Bagian 1. Langkah black-box

1. **Tentukan fitur dan masukannya** dari SRS/use case (Login, Registrasi, Tambah Makanan, Hapus Makanan, Hapus Akun, dll.).
2. **Bagi masukan menjadi kelas ekuivalen** (valid/tidak valid). Ambil satu wakil tiap kelas.
3. **Tambahkan nilai batas** (Boundary Value Analysis): tepat di batas, satu langkah di bawah, satu langkah di atas.
4. **Untuk kombinasi kondisi** (mis. peran, kata sandi) pakai **decision table**.
5. **Tulis test case**: ID, skenario, masukan, hasil diharapkan.
6. **Jalankan** pada aplikasi, catat **hasil aktual** dan **status** (Lulus/Gagal), sertakan tangkapan layar untuk yang penting.
7. **Gagal = bug**: catat di GitHub Issues memakai templat di bagian 5, perbaiki, uji ulang (regression test).

### 1.1 Login (EP)

Kelas: email valid terdaftar; email tidak terdaftar; email kosong; kata sandi benar/salah/kosong.

| ID | Skenario | Masukan | Diharapkan | Aktual | Status |
|----|----------|---------|------------|--------|--------|
| TC-LG-01 | Admin login benar | admin@chillguard.local / admin123 | Masuk ke dashboard Admin | | |
| TC-LG-02 | Pegawai login benar | rudy@chillguard.local / pegawai123 | Masuk ke dashboard Pegawai | | |
| TC-LG-03 | Kata sandi salah | rudy@chillguard.local / salah | Pesan "Email atau kata sandi salah", tetap di login | | |
| TC-LG-04 | Email tidak terdaftar | tidakada@x.com / pegawai123 | Pesan yang sama (tidak membocorkan email mana yang ada) | | |
| TC-LG-05 | Email kosong | (kosong) / pegawai123 | Pesan kolom wajib diisi | | |
| TC-LG-06 | Kata sandi kosong | rudy@chillguard.local / (kosong) | Pesan kolom wajib diisi | | |
| TC-LG-07 | Percobaan injeksi SQL | `' OR '1'='1` / apa saja | Login ditolak, tanpa galat database | | |
| TC-LG-08 | Sesi habis | Login, diam 30 menit, klik menu | Diarahkan ke login | | |
| TC-LG-09 | Akses tanpa login | Buka alamat dashboard langsung | Diarahkan ke login | | |

### 1.2 Registrasi (EP)

| ID | Skenario | Masukan | Diharapkan | Aktual | Status |
|----|----------|---------|------------|--------|--------|
| TC-RG-01 | Data valid | nama, email baru, sandi valid | Akun dibuat, peran Pegawai | | |
| TC-RG-02 | Email sudah terdaftar | rudy@chillguard.local | Pesan email sudah dipakai | | |
| TC-RG-03 | Format email salah | `rudy@` | Pesan format email salah | | |
| TC-RG-04 | Nama kosong | (kosong) | Pesan wajib diisi | | |
| TC-RG-05 | Sandi terlalu pendek | `123` | Pesan minimal karakter (tentukan batas, mis. 6) | | |
| TC-RG-06 | Kata sandi tersimpan terenkripsi | Setelah RG-01: `SELECT password FROM pengguna ORDER BY id DESC LIMIT 1;` | Berawalan `$2y$` (bcrypt), bukan teks asli | | |

### 1.3 Tambah Makanan (EP + BVA)

Hasil kode kondisi fungsi `validasiTambahMakanan` (waktu uji tetap 15 Nov 2026 12:00). Di aplikasi nyata, "sekarang" = jam server.

| ID | Skenario | Masukan | Diharapkan | Aktual | Status |
|----|----------|---------|------------|--------|--------|
| TC-TM-01 | Semua valid | nama "Susu UHT", kulkas Lt.2, kadaluarsa besok 12:00 | Tersimpan, kartu tampil | | |
| TC-TM-02 | Nama kosong | nama (kosong) | Ditolak: nama wajib | | |
| TC-TM-03 | Nama hanya spasi | "   " | Ditolak: nama wajib | | |
| TC-TM-04 | Kulkas belum dipilih | kulkas (kosong) | Ditolak: pilih kulkas | | |
| TC-TM-05 | Tanggal kosong | (kosong) | Ditolak: format tanggal | | |
| TC-TM-06 | Tanggal teks | "besok" | Ditolak: format tanggal | | |
| TC-TM-07 | Tanggal tidak ada | 31-02-2026 | Ditolak: format tanggal | | |
| TC-TM-08 | Tanggal masa lalu | kemarin | Ditolak: tanggal lampau | | |
| TC-TM-09 | Batas: 1 menit lalu | sekarang -1 menit | Ditolak | | |
| TC-TM-10 | Batas: tepat sekarang | sekarang | Diterima | | |
| TC-TM-11 | Foto JPG 1 MB | file valid | Foto tampil di kartu | | |
| TC-TM-12 | Foto tepat 2 MB (batas) | 2.097.152 byte | Diterima | | |
| TC-TM-13 | Foto > 2 MB | 2.097.153 byte atau lebih | Ditolak: ukuran | | |
| TC-TM-14 | Foto berformat GIF/PDF | `.gif`, atau `.pdf` diganti nama `.jpg` | Ditolak: tipe (periksa isi file, bukan ekstensi) | | |
| TC-TM-15 | Scan barcode (Android) | barcode kemasan | Kolom barcode terisi | | |
| TC-TM-16 | Scan dibatalkan | tekan Kembali di kamera | Kembali ke form tanpa galat | | |

### 1.4 Status makanan (BVA)

Aturan: sisa < 0 Kadaluarsa; 0 ≤ sisa ≤ 3 hari Mendekati; sisa > 3 hari Aman.

| ID | Sisa waktu | Diharapkan | Aktual | Status |
|----|------------|------------|--------|--------|
| TC-ST-01 | 15 hari | Aman, "Sisa 15 Hari" | | |
| TC-ST-02 | 3 hari + 1 detik | Aman | | |
| TC-ST-03 | tepat 3 hari | Mendekati | | |
| TC-ST-04 | 13 jam | Mendekati, "Sisa 13 Jam" | | |
| TC-ST-05 | tepat 0 | Mendekati | | |
| TC-ST-06 | -1 detik | Kadaluarsa, merah | | |
| TC-ST-07 | Urutan dashboard | Yang kadaluarsa/paling dekat di paling atas | | |

Cara membuat data uji cepat: tambahkan makanan dengan tanggal kadaluarsa yang diatur sesuai baris di atas, atau ubah langsung
`UPDATE makanan SET tanggal_kadaluarsa = NOW() + INTERVAL 13 HOUR WHERE id = 1;`.

### 1.5 Hapus dan pulihkan makanan

| ID | Skenario | Diharapkan | Aktual | Status |
|----|----------|------------|--------|--------|
| TC-HM-01 | Hapus makanan milik sendiri, konfirmasi OK | Masuk recycle bin (`kondisi='dihapus'`) | | |
| TC-HM-02 | Hapus lalu batal pada dialog | Tidak berubah | | |
| TC-HM-03 | Pegawai mengubah ID makanan orang lain lewat URL | Ditolak (403/pesan) | | |
| TC-HM-04 | Admin memulihkan dari recycle bin | Kembali aktif | | |
| TC-HM-05 | Tandai selesai (sudah diambil) | Hilang dari daftar aktif | | |

### 1.6 Hapus Akun (Decision Table)

| Aturan | R1 | R2 | R3 | R4 | R5 | R6 |
|--------|----|----|----|----|----|----|
| Akun ditemukan | T | Y | Y | Y | Y | Y |
| Akun adalah admin terakhir | - | Y | T | T | T | T |
| Dilakukan oleh admin | - | - | Y | T | T | Y |
| Kata sandi benar | - | - | - | T | Y | - |
| **Hasil** | AKUN_TIDAK_ADA | ADMIN_TERAKHIR | OK | PASSWORD_SALAH | OK | OK |

(Y = ya, T = tidak, - = tidak berpengaruh. R3 = admin menghapus admin lain; R6 = admin menghapus pegawai.)

| ID | Skenario | Diharapkan | Aktual | Status |
|----|----------|------------|--------|--------|
| TC-HA-01 | Pegawai hapus akun, sandi benar | Akun terhapus, makanan terkait ikut terhapus, kembali ke login | | |
| TC-HA-02 | Pegawai hapus akun, sandi salah | Ditolak, akun utuh | | |
| TC-HA-03 | Akun yang sudah dihapus mencoba login | Ditolak | | |
| TC-HA-04 | Admin terakhir menghapus dirinya | Ditolak | | |
| TC-HA-05 | Admin menghapus akun pegawai | Berhasil | | |
| TC-HA-06 | Cek data terkait | `SELECT COUNT(*) FROM makanan WHERE pengguna_id=<id>;` = 0 | | |
| TC-HA-07 | Cek log audit | Baris `hapus_akun` ada di `log_aktivitas`, `pengguna_id` NULL | | |
| TC-HA-08 | Foto milik akun | Berkas foto terhapus dari `www\uploads\` | | |

### 1.7 Uji portabilitas (khusus penilaian)

| ID | Skenario | Diharapkan | Aktual | Status |
|----|----------|------------|--------|--------|
| TC-PT-01 | Ekstrak zip ke folder baru, jalankan `start.bat` | Server menyala tanpa instalasi, /cek OK | | |
| TC-PT-02 | Pindah folder ke drive lain (mis. D: ke flashdisk E:) | Tetap berjalan | | |
| TC-PT-03 | Jalankan dua kali | Pesan port dipakai, tidak merusak data | | |
| TC-PT-04 | Tutup jendela server lalu `start.bat` lagi | Data tetap ada | | |
| TC-PT-05 | HP mengakses lewat hotspot | Aplikasi Android terbuka dan login | | |

---

## Bagian 2. Langkah white-box

1. **Pilih fungsi** yang mengandung keputusan (`if`, `switch`, perulangan).
2. **Gambar alur** (flow graph): tiap keputusan = simpul percabangan.
3. **Hitung cyclomatic complexity**: V(G) = jumlah keputusan + 1 (jalur independen minimum).
4. **Susun test case** agar:
   - **Statement coverage**: setiap baris dieksekusi minimal sekali;
   - **Branch coverage**: setiap keputusan bernilai **True dan False** minimal sekali;
   - **Path coverage**: setiap jalur independen dilewati.
5. **Jalankan** dan catat cakupan. Target: 100% branch pada fungsi inti.
6. **Perulangan (loop)**: uji 0 kali, 1 kali, dan banyak kali (mis. `urutkanPrioritas` dengan 0, 1, 3 data).

### 2.1 Cara menjalankan

Klik dua kali **`jalankan-uji.bat`**, atau di Command Prompt:
```
node\node.exe tests\jalankan-uji.js
```
Tidak memerlukan server maupun database (hanya `app\lib\waktu.js` dan `app\lib\validasi.js`). Keluaran memuat tabel kasus uji (Black-Box 1 sampai 4) dan laporan cakupan (White-Box).

### 2.2 Flow graph dan kompleksitas

**`tentukanStatus(sisaDetik)`**
```
masuk -> [sisa < 0 ?] -- ya --> kadaluarsa
             |tidak
         [sisa <= 3 hari ?] -- ya --> mendekati
             |tidak
           aman
```
Keputusan = 2, **V(G) = 3**, jalur: (1) kadaluarsa, (2) mendekati, (3) aman.

| Jalur | Masukan uji | Hasil |
|-------|-------------|-------|
| 1 | sisa -1 detik | kadaluarsa |
| 2 | sisa 13 jam | mendekati |
| 3 | sisa 15 hari | aman |

**`validasiTambahMakanan(...)`**: 4 keputusan berurutan (nama kosong, kulkas kosong, format tanggal, tanggal lampau). **V(G) = 5**, 5 jalur:
`NAMA_KOSONG`, `KULKAS_KOSONG`, `FORMAT_TANGGAL`, `TANGGAL_LALU`, `OK`.

**`putuskanHapusAkun(...)`**: 3 keputusan (akun ada, admin terakhir, kata sandi pada pegawai). **V(G) = 4**, jalur: `AKUN_TIDAK_ADA`, `ADMIN_TERAKHIR`, `PASSWORD_SALAH`, `OK`.

### 2.3 Hasil nyata penjalanan skrip (dari kit ini)

Dijalankan di Node.js 22.23.4 (Linux) pada saat kit disusun; di Windows hasilnya harus sama.

```
===== RINGKASAN: 31 test case, 31 PASS, 0 FAIL =====
```

Black-box otomatis:

| Kelompok | Teknik | ID | Jumlah | Lulus |
|----------|--------|----|--------|-------|
| `tentukanStatus` | BVA | BB-ST-01..09 | 9 | 9 |
| `hitungSisaDetik`, `formatSisaWaktu`, `urutkanPrioritas` | Contoh nilai + batas | BB-WK-01..06 | 6 | 6 |
| `validasiTambahMakanan` | EP + BVA | BB-TM-01..10 | 10 | 10 |
| `putuskanHapusAkun` | Decision table | BB-HA-01..06 | 6 | 6 |
| **Total** | | | **31** | **31** |

Cakupan white-box (dihitung dari eksekusi di atas):

| Fungsi | Keputusan | Branch tercakup | Persen |
|--------|-----------|-----------------|--------|
| `tentukanStatus` | 2 (4 cabang) | 4 / 4 | 100% |
| `validasiTambahMakanan` | 4 (8 cabang) | 8 / 8 | 100% |
| `putuskanHapusAkun` | 3 (6 cabang) | 6 / 6 | 100% |

Catatan jujur: 100% ini berlaku untuk **tiga fungsi inti** saja, bukan seluruh aplikasi. Uji fungsi lain (kueri, kontrol sesi, unggah foto)
dilakukan lewat tabel black-box Bagian 1. Cakupan dihitung oleh skrip sederhana, bukan alat seperti c8/Istanbul; bila dosen meminta alat,
jalankan `npx c8 node tests/jalankan-uji.js` (butuh Node.js + internet di laptop pengembangan; tidak ada di paket portable).

### 2.4 Uji alur aplikasi web yang sudah dijalankan penyusun kit (86 pemeriksaan, semua lulus)

Selain skrip di atas, seluruh aplikasi web diuji lewat permintaan HTTP nyata terhadap server Node.js 22.23.4 + SQLite (Linux) dari kit ini.
Ini membuktikan logika aplikasi; **bukan** pengganti uji Anda sendiri di Windows, browser, dan HP.

| Kelompok | Yang diperiksa | Kasus tabel terkait |
|----------|----------------|---------------------|
| Login | sandi salah, email tak terdaftar, kosong, injeksi SQL, akses tanpa login, login admin/pegawai, sesi habis 30 menit | TC-LG-01..05, 07, 08, 09 |
| Registrasi | format email, nama kosong, sandi pendek, konfirmasi beda, email ganda, sukses, hash bcrypt `$2b$` | TC-RG-01..06 |
| Tambah/ubah makanan | nama kosong/spasi, kulkas kosong/fiktif, tanggal kosong/teks/tak ada/lampau/batas, foto PNG sah, foto >2 MB, skrip menyamar `.png`, GIF, XSS pada nama | TC-TM-01..14 |
| Status dan urutan | status dihitung dari tanggal, urutan prioritas, pencarian, filter status, banner H-1/H-0 | TC-ST-01..07 |
| Hapus/pulihkan | hapus ke Recycle Bin, selesai, hapus milik orang lain ditolak, pulihkan, hapus permanen | TC-HM-01, 03, 04, 05 |
| Notifikasi | pengingat otomatis dibuat sekali (tidak berulang), alarm admin per makanan dan umum | - |
| Hapus akun | sandi salah ditolak, sukses, makanan ikut terhapus, foto terhapus dari disk, log audit `pengguna_id` NULL, login akun terhapus ditolak, admin terakhir ditolak, admin hapus pegawai, sesi akun terhapus tidak valid | TC-HA-01..08 |
| Hak akses dan keamanan | pegawai ke halaman Admin = 403, POST tanpa token CSRF = 400, peran berubah berlaku seketika | - |
| Admin | ringkasan 10 lantai (tanpa lantai 6), filter lantai, laporan, CSV (BOM + kutip), tanggal laporan tidak valid | - |
| Chat | pegawai-admin dua arah, pesan >500 ditolak, tanpa CSRF ditolak, tidak bisa membaca percakapan orang lain | - |

Belum tercakup (harus Anda uji sendiri): scan kamera (TC-TM-15, 16), tampilan di browser Windows, aplikasi Android, jaringan hotspot, uji portabilitas (TC-PT-01..05).
Kolom **Aktual** dan **Status** pada tabel di Bagian 1 sengaja dikosongkan: isi dari hasil pengujian Anda sendiri dan lampirkan tangkapan layar.

### 2.5 Menambah kasus uji sendiri

Buka `tests\jalankan-uji.js`, cari kelompok yang sesuai, tambahkan satu baris dengan pola yang sama (ID, deskripsi, masukan, nilai diharapkan).
Jalankan ulang; skrip otomatis ikut menghitung ulang cakupan.

---

## Bagian 3. Perbandingan untuk laporan

| Aspek | Black-box | White-box |
|-------|-----------|-----------|
| Contoh temuan | Pesan error tidak tampil saat tanggal salah | Cabang `ADMIN_TERAKHIR` tidak pernah diuji |
| Kelebihan | Sesuai sudut pandang pengguna, tidak butuh kode | Menemukan jalur tersembunyi, dasar ukuran cakupan |
| Keterbatasan | Tidak tahu jalur kode yang terlewat | Tidak menemukan fitur yang hilang dari spesifikasi |
| Di proyek ini | Bagian 1 | Bagian 2 |

## Bagian 4. Pengujian tambahan yang disarankan

- **Regresi**: jalankan ulang `jalankan-uji.bat` dan tabel utama setiap sebelum merge ke `main`.
- **Kompatibilitas**: Chrome, Edge, dan aplikasi Android; layar HP dan laptop.
- **Keamanan dasar**: injeksi SQL pada login/pencarian, XSS (`<script>alert(1)</script>` pada nama makanan harus tampil sebagai teks), akses halaman Admin sebagai Pegawai (harus ditolak), unggah berkas `.php` ke folder foto (harus ditolak dan tidak dapat dijalankan).
- **Kinerja ringan**: dashboard dengan 100 makanan tetap terbuka kurang dari 3 detik.

## Bagian 5. Templat laporan bug (GitHub Issue)

```
Judul      : [Bug] <ringkasan satu kalimat>
ID uji     : TC-XX-NN
Lingkungan : Windows 11 / Chrome 1xx / Android 1x
Langkah    : 1. ...  2. ...  3. ...
Diharapkan : ...
Aktual     : ...
Bukti      : (tangkapan layar)
Tingkat    : Kritis / Tinggi / Sedang / Rendah
Penanggung jawab : @username
```
Setelah diperbaiki: ubah status uji ke **Lulus**, tulis nomor commit/PR, dan jalankan ulang uji terkait.

## Bagian 6. Rekap hasil (isi di akhir)

| Kelompok | Total kasus | Lulus | Gagal | Catatan |
|----------|-------------|-------|-------|---------|
| Login | 9 | | | |
| Registrasi | 6 | | | |
| Tambah Makanan | 16 | | | |
| Status makanan | 7 | | | |
| Hapus/pulihkan makanan | 5 | | | |
| Hapus Akun | 8 | | | |
| Portabilitas | 5 | | | |
| Otomatis (skrip) | 31 | 31 | 0 | cakupan branch 100% pada 3 fungsi |

Lanjut ke [07. Manajemen proyek](07_Manajemen-Proyek.md).
