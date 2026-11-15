# 02. Menjalankan dari Flashdisk (E:) dan Menyambungkan HP

## Konsep singkat

Satu program (`node\node.exe`) menjalankan satu berkas (`app\server.js`). Server web dan database SQLite berada dalam satu proses,
sehingga tidak ada Apache, PHP, atau MariaDB yang harus diatur. Data (akun, makanan, foto) disimpan di folder `data\` di sebelah aplikasi,
jadi **ikut terbawa di flashdisk**.

## Langkah 1. Salin ke flashdisk

1. Ekstrak `ChillGuard-Portable.zip` langsung ke flashdisk, hasilnya `E:\ChillGuard\` (huruf drive boleh berbeda).
2. Pastikan di dalamnya ada `start.bat`, `node\node.exe`, dan `app\`.
3. Flashdisk berformat FAT32, exFAT, atau NTFS semuanya bisa. Disarankan USB 3.0 agar start-up cepat.

## Langkah 2. Jalankan

1. Klik dua kali **`start.bat`**.
2. Jendela hitam muncul dan menampilkan:
   ```
   CHILL GUARD BERJALAN
   Di komputer ini : http://localhost:8080/
   Dari HP (Wi-Fi) : http://192.168.x.x:8080/
   ```
   Browser terbuka sendiri. Jika tidak, ketik `http://localhost:8080/` di browser.
3. Saat pertama kali, Windows dapat menampilkan:
   - **SmartScreen** ("Windows protected your PC"): klik **More info** lalu **Run anyway**.
   - **Windows Security Alert** untuk `node.exe`: klik **Allow access** (centang Private; Public bila memakai hotspot).
4. Periksa `http://localhost:8080/cek`: semua baris harus **OK**.
5. Masuk: `admin@chillguard.local` / `admin123` atau `rudy@chillguard.local` / `pegawai123`.

## Langkah 3. Berhenti

Tutup jendela hitam atau tekan **Ctrl+C**. Database SQLite aman terhadap penutupan mendadak; tidak ada `stop.bat`.
Setelah jendela tertutup, flashdisk boleh dicabut (tetap gunakan *Safely Remove* bila ada penyimpanan sedang berjalan).

## Langkah 4. Data demo yang bersih

Sebelum presentasi: tutup server, jalankan **`reset-data.bat`**, ketik `YA`, lalu jalankan `start.bat` lagi.
Data contoh (4 akun, 17 kulkas, 6 makanan) dibuat ulang. Waktu kadaluarsa contoh dihitung dari saat database dibuat,
jadi status Aman/Mendekati/Kadaluarsa selalu terlihat segar.

## Langkah 5. Sambungkan HP (untuk aplikasi Android)

HP dan laptop harus berada di **jaringan yang sama**. Wi-Fi kampus sering memblokir komunikasi antarperangkat, jadi pakai salah satu cara berikut.

**Cara A: HP sebagai hotspot (disarankan)**
1. Aktifkan hotspot di HP atau HP kedua, sambungkan laptop ke hotspot itu.
2. Jalankan `start.bat`. Alamat IP laptop tertulis pada baris "Dari HP (Wi-Fi)".
3. Di aplikasi Android atau browser HP, buka `http://<IP laptop>:8080/`.

**Cara B: laptop sebagai hotspot**
1. Windows: **Settings > Network & internet > Mobile hotspot > On**. Sambungkan HP ke hotspot laptop.
2. IP laptop biasanya `192.168.137.1` (sama dengan alamat bawaan aplikasi Android).

**Cara C: Wi-Fi rumah/kantor biasa** bila tidak ada isolasi klien.

Uji dari browser HP: `http://<IP laptop>:8080/cek`. Jika terbuka, jaringan benar.

## Mengubah port

Port bawaan 8080. Jika sudah dipakai program lain, server otomatis mencoba 8081, 8082, dan seterusnya (lihat alamat di jendela).
Untuk memaksa port tertentu: buka Command Prompt di folder aplikasi dan jalankan `set CG_PORT=9000` lalu `start.bat`.

## Perintah manual (bila start.bat tidak bisa dipakai)

Buka Command Prompt (Win+R, ketik `cmd`), lalu:
```
E:
cd \ChillGuard
set CG_DATA=E:\ChillGuard\data
node\node.exe app\server.js
```
Bila ingin memakai Node.js yang terpasang di komputer (versi 22.13+): `node app\server.js`.

## Pemecahan masalah

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `start.bat` berkedip lalu hilang | Dijalankan dari dalam zip tanpa diekstrak | Ekstrak dulu (klik kanan > Extract All), lalu jalankan dari folder hasil ekstrak |
| "Windows protected your PC" | SmartScreen menandai berkas baru | **More info > Run anyway** |
| Antivirus menghapus/memblokir `node.exe` | Peringatan palsu pada program tanpa tanda tangan di flashdisk | Pulihkan dari karantina atau tambahkan pengecualian folder; atau ganti dengan `node.exe` resmi dari nodejs.org ([01](01_Persiapan.md)) |
| "node.exe is not compatible with this version of Windows" / tidak bisa dijalankan | Windows 32-bit atau Windows 7/8 | Pakai laptop dengan Windows 10/11 64-bit |
| Pesan `Port 8080 dipakai ... mencoba 8081` | Ada program lain di 8080 | Normal. Pakai alamat yang tertera; atur ulang alamat di aplikasi Android |
| Halaman kosong di HP / "tidak dapat terhubung" | Firewall atau isolasi klien Wi-Fi | Klik **Allow access** saat diminta atau jalankan `buka-firewall.bat` (Run as administrator); pakai hotspot HP (Cara A) |
| Database "locked" atau galat penulisan | Flashdisk proteksi tulis / penuh / terlalu lambat | Periksa saklar proteksi tulis dan ruang kosong; salin folder ke SSD laptop untuk demo |
| `Node.js ... terlalu lama` | Memakai Node lama dari komputer | Jalankan lewat `start.bat` (memakai `node\node.exe`) |
| Lupa/rusak data | - | Tutup server, `reset-data.bat`, `start.bat` |
| Jam status terlihat salah | - | Waktu aplikasi memakai WIB tetap (UTC+7), tidak bergantung zona waktu Windows. Periksa jam Windows sudah benar; lihat `/cek` |

Lanjut ke [03. Isi Aplikasi dan Database](03_Aplikasi-dan-Database.md).
