# 04. Aplikasi Android (WebView + Scan Barcode)

Sesuai Tugas 9, aplikasi Android adalah **pembungkus (WebView)** yang menampilkan website Chill Guard yang sama,
ditambah satu fitur native: **scan barcode/QR dengan kamera**. Semua data tetap di server laptop Anda.

Proyek Android Studio **lengkap sudah disediakan** di `android\ChillGuardApp\` (Java, minSdk 26, ZXing untuk scan, ikon, tema, manifest).
Dikerjakan di laptop pengembangan (bukan di komputer kampus). Hasil akhirnya satu berkas: `android\chillguard.apk`.

## Langkah 1. Buka proyek

1. Buka Android Studio, **File > Open**, pilih folder `ChillGuard-Portable\android\ChillGuardApp`, **OK**.
2. Tunggu **Gradle sync** selesai (butuh internet pada pertama kali; Android Studio mengunduh Gradle 8.7, plugin, dan library). Setujui bila diminta *Install missing SDK / platform*.
3. Bila muncul saran *Update Android Gradle Plugin* karena Android Studio Anda lebih baru, terima saran tersebut.

> Proyek ini belum dikompilasi oleh penyusun kit. Jika ada galat, lihat tabel "Masalah umum" di bawah.

## Langkah 2. Periksa pengaturan penting (sudah terisi)

| Berkas | Isi |
|--------|-----|
| `app\build.gradle.kts` | `applicationId = com.chillguard.app`, `minSdk = 26`, dependensi ZXing `zxing-android-embedded:4.3.0` |
| `app\src\main\AndroidManifest.xml` | izin INTERNET dan CAMERA, `usesCleartextTraffic="true"` (HTTP di jaringan lokal) |
| `app\src\main\java\com\chillguard\app\MainActivity.java` | WebView, jembatan `AndroidApp.scanBarcode()` dan `bukaPengaturan()`, pemilih foto, tombol Kembali |

Ringkasan perilaku aplikasi:
- Memuat alamat server (bawaan `http://192.168.137.1:8080/`). Bila server tidak terjangkau muncul dialog **Tidak dapat terhubung** dengan tombol **Coba Lagi** dan **Atur Server** (alamat disimpan di HP). Halaman Masuk juga punya tautan **Pengaturan Server** yang hanya tampil di aplikasi.
- Tombol **Scan** di form Tambah Makanan membuka kamera (ZXing) dan mengisi kolom barcode.
- Mendukung unggah foto dari galeri, tombol Kembali, dan pengaturan tepi layar.

Berkas `android\kode-referensi\` adalah salinan kode yang sama bila Anda ingin membuat proyek dari nol (Empty Views Activity, Java, package `com.chillguard.app`, minSdk 26).

## Langkah 3. Coba di emulator atau HP (sebelum membuat APK)

**Emulator** (Tools > Device Manager > Create Device): server di laptop dapat dijangkau di alamat khusus **`http://10.0.2.2:8080/`**.
Saat dialog gagal terhubung muncul, pilih **Atur Server** dan isi alamat itu. Kamera emulator hanya simulasi, jadi uji scan di HP sungguhan.

**HP sungguhan (kabel USB):**
1. HP: **Settings > About phone** ketuk **Build number** 7 kali, lalu aktifkan **Developer options > USB debugging**.
2. Sambungkan USB, izinkan debugging di HP, pilih perangkat di Android Studio, klik **Run** (segitiga hijau).
3. Server laptop harus menyala (`start.bat`) dan HP satu jaringan dengan laptop ([02, langkah 5](02_Menjalankan-dari-Flashdisk.md)).
4. Jika IP laptop bukan 192.168.137.1, aplikasi menampilkan dialog gagal terhubung: ketuk **Atur Server**, isi `http://<IP laptop>:8080/`, lalu **Simpan**.

## Langkah 4. Membuat APK

**Cara A (menu):** `Build > Generate App Bundles or APKs > Generate APKs`, tunggu notifikasi, klik **locate**.

**Cara B (terminal Android Studio):**
```
gradlew assembleDebug
```
Hasil: `app\build\outputs\apk\debug\app-debug.apk`. (Berkas `gradlew` tidak disertakan; pakai Cara A di Android Studio. Cara B hanya bila Anda membuat proyek sendiri.)

**Cara C (tanpa Android Studio): GitHub Actions**

Repo GitHub membuat APK otomatis di server GitHub. Berkas workflow sudah ada di `.github\workflows\android-apk.yml`.
1. Pastikan proyek sudah di-push ke GitHub ([05](05_Panduan-GitHub.md)), termasuk folder `.github\workflows\`.
2. Buka repo di GitHub, tab **Actions**, pilih **Build APK Android**, klik **Run workflow** (atau cukup push perubahan di folder `android\`).
3. Tunggu sekitar 3-6 menit sampai tanda centang hijau, lalu klik run tersebut.
4. Di bagian **Artifacts**, unduh **chillguard-apk** (berupa zip), ekstrak, dan hasilnya `chillguard.apk`. Simpan ke `android\chillguard.apk` dan pasang di HP (Langkah 5).
5. Bila tanda silang merah: buka run itu, klik langkah **Build APK debug**, salin pesan galatnya, lalu perbaiki (lihat "Masalah umum").

Catatan: workflow ini memakai Gradle 8.7 dan JDK 17 sesuai proyek, dan belum pernah dijalankan oleh penyusun kit.

Salin hasilnya ke **`ChillGuard-Portable\android\chillguard.apk`**. APK *debug* sudah cukup untuk demo; tidak perlu akun Play Store.

## Langkah 5. Memasang APK di HP

1. Pindahkan `chillguard.apk` ke HP (kabel USB, flashdisk OTG, atau kirim lewat aplikasi pesan).
2. Buka berkas di HP. Jika diminta, izinkan **Install unknown apps** untuk aplikasi yang Anda pakai membuka berkas.
3. Bila **Play Protect** memperingatkan, pilih **Install anyway** (aplikasi tidak dikenal karena bukan dari Play Store).
4. Buka **Chill Guard**, lalu atur alamat server (dialog muncul bila gagal terhubung). Izin **kamera** diminta saat pertama kali menekan Scan.

## Alur uji di HP

1. Login sebagai `rudy@chillguard.local` / `pegawai123`.
2. **Tambah Makanan > Scan Barcode** arahkan ke barcode kemasan. Kolom barcode terisi (nama produk terisi otomatis bila internet tersedia).
3. Isi tanggal kadaluarsa, simpan, dan cek kartu di dashboard.
4. Uji **Hapus Akun** memakai akun baru (jangan akun demo).

## Masalah umum

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| "Gagal memuat" / halaman putih | Alamat server salah atau jaringan beda | Buka alamat yang sama di browser HP; samakan jaringan; cek firewall ([02](02_Menjalankan-dari-Flashdisk.md)) |
| `net::ERR_CLEARTEXT_NOT_PERMITTED` | Atribut cleartext belum ditambahkan | manifest, bagian "Periksa pengaturan penting" |
| Sync Gradle gagal | Tidak ada internet / versi library tidak ada | Sambungkan internet; ubah versi ZXing |
| Tombol scan tidak membuka kamera | Izin kamera ditolak | Pengaturan HP > Aplikasi > Chill Guard > Izin > Kamera |
| Tombol Scan tidak berfungsi di browser biasa | Memang hanya tersedia di aplikasi | Isi barcode manual di browser |
| Kesalahan kompilasi pada `MainActivity.java` | Nama paket berbeda | Baris `package` paling atas harus `com.chillguard.app`; jika tidak, sesuaikan baris itu |
| Unggah foto tidak muncul pilihan | Izin penyimpanan/kamera | Gunakan pemilih berkas bawaan; beri izin saat diminta |

Lanjut ke [05. Panduan GitHub](05_Panduan-GitHub.md).
