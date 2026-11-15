# 07. Manajemen Proyek (Tugas 13)

Dokumen ini adalah **kerangka yang dapat langsung diisi dan disesuaikan** dengan kondisi tim Anda.
Tanggal, durasi, dan pembagian tugas di bawah adalah **usulan**; ubah agar sesuai jadwal sebenarnya.
Jangan memasukkan data yang belum benar-benar terjadi sebagai fakta (mis. "sprint selesai") sebelum dikerjakan.

## 1. Ringkasan proyek

| Butir | Isi |
|-------|-----|
| Nama | Chill Guard, sistem cerdas penyimpanan makanan pada kulkas |
| Instansi | Direktorat Jenderal Perimbangan Keuangan (DJPK), 17 kulkas pada lantai 2,3,4,5,7,8,9,10,11,12 |
| Tujuan | Mencegah makanan kedaluwarsa tidak terpantau melalui pencatatan, status otomatis, dan pengingat |
| Produk | Aplikasi web (Node.js + SQLite) + aplikasi Android (WebView), portable |
| Metode | Scrum sederhana, 3 sprint |
| Tim | Rudy Alpacino (Product Owner + Scrum Master), Anggita Adelia, Muhammad Wildan Fauzi (Pengembang) |
| Perkakas | GitHub (repo, Issues, Projects, Milestones), WhatsApp/Discord untuk komunikasi |

Peran dapat digilir tiap sprint. Anggota ketiga kali tetap mengerjakan kode dan uji.

## 2. Product backlog (user story)

Format: *Sebagai (peran), saya ingin (fitur), agar (manfaat).* Prioritas: **T** tinggi, **S** sedang, **R** rendah.
Estimasi dalam *story point* (SP) skala 1-8.

| ID | User story | Kriteria penerimaan (ringkas) | Prior. | SP | Sprint |
|----|------------|-------------------------------|--------|----|--------|
| US-01 | Sebagai pegawai, saya ingin mendaftar akun agar dapat memakai aplikasi | Email unik, sandi di-hash | T | 3 | 1 |
| US-02 | Sebagai pengguna, saya ingin login dan logout dengan aman | Sandi salah ditolak, sesi 30 menit | T | 3 | 1 |
| US-03 | Sebagai pegawai, saya ingin menambah makanan (nama, kulkas, tanggal kadaluarsa, foto) | Validasi tanggal dan foto | T | 5 | 1 |
| US-04 | Sebagai pegawai, saya ingin melihat daftar makanan berkode warna dan terurut prioritas | Aman/Mendekati/Kadaluarsa benar | T | 5 | 2 |
| US-05 | Sebagai pegawai, saya ingin mengubah dan menghapus makanan saya | Hanya milik sendiri | T | 3 | 2 |
| US-06 | Sebagai pegawai, saya ingin mencari dan memfilter makanan | Cari nama, filter status | S | 3 | 2 |
| US-07 | Sebagai pegawai, saya ingin menerima notifikasi dan banner saat makanan akan kadaluarsa | Dikirim sekali per makanan | T | 5 | 2 |
| US-08 | Sebagai pegawai, saya ingin scan barcode lewat Android | Kolom barcode terisi | S | 5 | 3 |
| US-09 | Sebagai pengguna, saya ingin menghapus akun saya | Konfirmasi sandi, data ikut terhapus | S | 3 | 2 |
| US-10 | Sebagai admin, saya ingin memantau makanan per lantai dan kulkas | Ringkasan per lantai | T | 5 | 3 |
| US-11 | Sebagai admin, saya ingin mengirim alarm ke pegawai | Notifikasi masuk ke penerima | S | 3 | 3 |
| US-12 | Sebagai admin, saya ingin memulihkan makanan dari recycle bin | Status kembali aktif | S | 2 | 3 |
| US-13 | Sebagai admin, saya ingin laporan logtime (CSV/PDF) | File dapat diunduh | S | 5 | 3 |
| US-14 | Sebagai pegawai dan admin, saya ingin live chat | Pesan terkirim dan terbaca | R | 5 | 3 |
| US-15 | Sebagai tim, kami ingin seluruh aplikasi portable dalam satu zip | Jalan di komputer bersih | T | 5 | 3 |
| US-16 | Sebagai tim, kami ingin pengujian black-box dan white-box terdokumentasi | Tabel uji terisi | T | 3 | 3 |

Total: 62 SP. Rata-rata 3 SP per orang per minggu cukup realistis untuk mahasiswa dengan beban kuliah lain; atur ulang bila kecepatan nyata berbeda.
Bila waktu mepet, tunda **US-13 dan US-14** (prioritas rendah/sedang) lebih dulu.

## 3. Work Breakdown Structure (WBS)

```
1 Chill Guard
├─ 1.1 Manajemen proyek
│   ├─ 1.1.1 Perencanaan, backlog, jadwal
│   ├─ 1.1.2 Rapat Scrum (planning, daily, review, retrospektif)
│   └─ 1.1.3 Dokumentasi dan laporan
├─ 1.2 Analisis dan perancangan
│   ├─ 1.2.1 SRS dan use case
│   ├─ 1.2.2 Class, sequence, activity, state, deployment diagram
│   └─ 1.2.3 Rancangan antarmuka (Tugas 9)
├─ 1.3 Konstruksi
│   ├─ 1.3.1 Database (skema, data awal)
│   ├─ 1.3.2 Web: autentikasi, makanan, notifikasi, admin, chat
│   ├─ 1.3.3 Android: WebView + scan barcode
│   └─ 1.3.4 Paket portable (node.exe, skrip)
├─ 1.4 Pengujian
│   ├─ 1.4.1 Black-box
│   ├─ 1.4.2 White-box
│   └─ 1.4.3 Uji portabilitas
├─ 1.5 Version control
│   └─ 1.5.1 Repo, branch, PR, review, release
└─ 1.6 Penyerahan
    ├─ 1.6.1 Zip final dan APK
    └─ 1.6.2 Demo dan presentasi
```

## 4. Jadwal sprint dan Gantt

Contoh 6 minggu (3 sprint x 2 minggu). Ganti "M1" dst. dengan tanggal nyata, mis. mulai Senin terdekat.

| Sprint | Minggu | Tujuan (Sprint Goal) | Story |
|--------|--------|----------------------|-------|
| 1 | M1-M2 | Fondasi: server portable jalan, pengguna bisa daftar, login, tambah makanan | US-01, 02, 03 |
| 2 | M3-M4 | Inti: daftar berstatus, ubah/hapus, cari/filter, notifikasi, hapus akun | US-04, 05, 06, 07, 09 |
| 3 | M5-M6 | Lengkap: Android, admin, chat, laporan, paket final dan uji | US-08, 10-16 |

Gantt sederhana (■ = dikerjakan):

| Kegiatan | M1 | M2 | M3 | M4 | M5 | M6 |
|----------|----|----|----|----|----|----|
| Server portable + database | ■ | | | | | |
| Registrasi, login | ■ | ■ | | | | |
| Tambah makanan | | ■ | | | | |
| Daftar, ubah, hapus, cari, filter | | | ■ | ■ | | |
| Notifikasi | | | | ■ | | |
| Hapus akun | | | | ■ | | |
| Android + scan | | | | | ■ | |
| Panel admin, laporan, chat | | | | | ■ | ■ |
| Pengujian black/white-box | | ■ | ■ | ■ | ■ | ■ |
| Paket zip + uji komputer bersih | | | | | | ■ |
| Dokumentasi + demo | | | | | | ■ |

Pengujian berjalan di setiap sprint (bukan hanya di akhir). Titik tolok (milestone): **M2** login+tambah makanan jalan, **M4** web inti selesai, **M6** zip final + APK.

## 5. Pembagian tugas (RACI ringkas)

| Pekerjaan | Rudy | Anggita | Wildan |
|-----------|------|---------|--------|
| Server portable, skrip, zip | R | C | C |
| Auth + hapus akun | R | I | C |
| Tambah makanan + scan | C | I | R |
| Daftar makanan, notifikasi | I | R | C |
| Admin, laporan, chat | C | R | I |
| Android | C | I | R |
| Black/white-box | R | R | R |
| GitHub, review PR | A | R | R |
| Dokumen dan presentasi | R | R | R |

R = pelaksana, A = penanggung jawab akhir, C = dikonsultasi, I = diberi tahu.

## 6. Register risiko

Skala: Kemungkinan (K) dan Dampak (D) 1-3; Skor = K x D.

| ID | Risiko | K | D | Skor | Mitigasi | Cadangan |
|----|--------|---|---|------|----------|----------|
| R1 | Komputer kampus tidak mengizinkan program portable / skrip | 2 | 3 | 6 | Bawa laptop sendiri | Video demo + rekaman layar |
| R2 | Wi-Fi kampus memblokir komunikasi HP-laptop | 3 | 2 | 6 | Pakai hotspot HP/laptop | Demo web di laptop + emulator |
| R3 | Port 8080 sudah dipakai | 2 | 1 | 2 | Server otomatis pindah port | Perintah manual (docs 02) |
| R4 | Firewall memblokir node.exe | 2 | 2 | 4 | `buka-firewall.bat` / izinkan saat diminta | Akses lokal `localhost` saja |
| R5 | Anggota tidak aktif / terlambat | 2 | 3 | 6 | Daily stand-up, issue ber-assignee | Bagi ulang story, tunda prioritas rendah |
| R6 | Konflik merge | 2 | 1 | 2 | Branch per fitur, PR kecil | Selesaikan bersama (docs 05 bagian H) |
| R7 | Kehilangan data/flashdisk rusak | 1 | 3 | 3 | Repo GitHub + Release + 2 salinan | Unduh Release |
| R8 | Dokumen dan aplikasi tidak konsisten | 2 | 2 | 4 | Tinjau daftar ketidakkonsistenan di `00_BACA-DULU.txt` | Perbarui dokumen sebelum dikumpulkan |
| R9 | Mundur jadwal karena beban kuliah lain | 3 | 2 | 6 | Backlog berprioritas, potong US-13/14 | Demo fitur inti saja |
| R10 | Library scan Android gagal sinkron | 1 | 2 | 2 | Cache Gradle, versi cadangan | Isi barcode manual |
| R11 | node.exe tidak jalan/diblokir antivirus di komputer penilaian | 2 | 3 | 6 | Uji di komputer lain H-3; siapkan node.exe resmi cadangan | Pakai laptop sendiri / video demo |
| R12 | Kebocoran kredensial di repo | 1 | 3 | 3 | `.gitignore` (data/, node/ tidak di-commit) | Ganti sandi, hapus dari riwayat |

## 7. Scrum: acara dan artefak

| Acara | Waktu | Isi |
|-------|-------|-----|
| Sprint Planning | Awal sprint, 1 jam | Pilih story dari backlog, pecah jadi issue, tentukan Sprint Goal |
| Daily Stand-up | 10 menit (chat/tatap muka) | Kemarin apa, hari ini apa, hambatan |
| Sprint Review | Akhir sprint, 30 menit | Demo hasil, kumpulkan masukan |
| Sprint Retrospective | Setelah review, 20 menit | Apa yang baik, perlu diperbaiki, tindakan |

Artefak: Product Backlog, Sprint Backlog (kolom di GitHub Projects), Increment (build yang berjalan, di branch `main`).
**Definition of Done**: kode dikerjakan di branch, lulus uji terkait, sudah di-review dan di-merge lewat PR, tidak merusak `jalankan-uji.bat`, dokumentasi diperbarui.

Catatan retrospektif (isi setelah tiap sprint):

| Sprint | Berjalan baik | Perlu diperbaiki | Tindakan |
|--------|---------------|------------------|----------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## 8. Pemetaan ke GitHub Projects

| Konsep Scrum | Di GitHub |
|--------------|-----------|
| Product Backlog | Project board, kolom **Backlog** (satu Issue per user story) |
| Sprint | **Milestone** "Sprint 1/2/3" + tenggat |
| Sprint Backlog | Kolom **Sprint Backlog** |
| Task dikerjakan | **In Progress** |
| Menunggu review | **In Review** (Pull Request terbuka) |
| Selesai | **Done** (otomatis saat PR `Closes #n` digabung) |
| Bug | Issue berlabel `bug` |

## 9. Burn-down (opsional)

Catat sisa SP di akhir tiap minggu (contoh bentuk, isi dengan data nyata):

| Akhir minggu | M0 | M1 | M2 | M3 | M4 | M5 | M6 |
|--------------|----|----|----|----|----|----|----|
| Sisa SP ideal | 62 | 52 | 41 | 31 | 21 | 10 | 0 |
| Sisa SP aktual | 62 | | | | | | |

## 10. Daftar bukti untuk laporan Tugas 13

- [ ] Product backlog dan user story
- [ ] WBS
- [ ] Jadwal sprint dan Gantt
- [ ] Register risiko
- [ ] Tangkapan layar GitHub Projects (board) dan Milestones
- [ ] Notulen singkat planning/review/retrospektif
- [ ] Burn-down (bila dipakai)

Lanjut ke [08. Membuat ZIP final dan uji di kampus](08_ZIP-Final-dan-Hari-Penilaian.md).
