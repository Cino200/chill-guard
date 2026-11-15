# 05. Panduan GitHub (Tugas 11: Version Control)

Tujuan: seluruh kode Chill Guard disimpan di GitHub, dikerjakan **per fitur di branch terpisah**, digabung lewat
**Pull Request** setelah di-review. Tiga anggota: Rudy, Anggita, Wildan. Perintah di bawah dijalankan di
**Git Bash** atau Command Prompt.

Yang masuk repository: kode (`app\`, `tests\`, `docs\`, `android\`, skrip `.bat`, `package.json`).
Yang **tidak** masuk: `node\` (node.exe 87 MB), `app\node_modules\`, `data\`, `*.zip`, `*.apk`. Semuanya sudah diatur di `.gitignore`.
APK dan zip dibagikan lewat **GitHub Releases** (langkah 14).

## A. Persiapan satu kali (tiap anggota)

1. Pasang Git ([01](01_Persiapan.md)). Cek: `git --version`.
2. Identitas:
   ```
   git config --global user.name "Nama Lengkap Anda"
   git config --global user.email "email-github-anda@contoh.com"
   git config --global init.defaultBranch main
   ```
3. Buat akun di https://github.com bila belum punya.
4. **Autentikasi**: GitHub tidak lagi menerima kata sandi untuk `git push`. Gunakan salah satu:
   - **Git Credential Manager** (sudah ikut Git for Windows): saat `git push` pertama muncul jendela masuk ke GitHub di browser, cukup login.
   - **Personal Access Token**: GitHub > Settings > Developer settings > Personal access tokens, buat token dengan izin `repo`, pakai token sebagai kata sandi.
   - Git Portable di komputer kampus: pakai token, dan jangan simpan kredensial di komputer umum.

## B. Ketua tim membuat repository (Rudy)

1. GitHub > **New repository**. Nama: `chill-guard`. Deskripsi: "Sistem cerdas penyimpanan makanan pada kulkas - DJPK".
2. Pilih **Public** (atau Private bila dosen diberi akses). Jangan centang README/.gitignore (sudah ada di folder kit).
3. **Create repository**, salin URL, mis. `https://github.com/<username>/chill-guard.git`.
4. Undang anggota: **Settings > Collaborators > Add people** (Anggita dan Wildan). Mereka menerima email undangan dan harus menerimanya.

## C. Mengunggah proyek pertama kali (Rudy)

Di folder `ChillGuard-Portable` (folder yang berisi `README.md` dan `.gitignore`):

```
git init
git add .
git status
git commit -m "feat: struktur awal proyek, konfigurasi portable, skema database"
git branch -M main
git remote add origin https://github.com/<username>/chill-guard.git
git push -u origin main
```

Periksa dengan `git status` **sebelum** commit: pastikan tidak ada `node/`, `app/node_modules/`, `data/`, `*.zip`, `*.apk`. Jika terlanjur ter-add: `git rm -r --cached nama-folder`.

## D. Anggota lain mengambil proyek

```
git clone https://github.com/<username>/chill-guard.git
cd chill-guard
```
Pasang Node.js 22.13 atau lebih baru (https://nodejs.org), lalu:
```
cd chill-guard\app
npm install
node server.js
```
`node\node.exe` portable tidak ada di repo (terlalu besar); di komputer penilaian pakai zip, bukan clone.

## E. Strategi branch

```
main                    kode stabil (siap didemokan)
 ├─ feature/login            Rudy
 ├─ feature/hapus-akun       Rudy
 ├─ feature/tambah-makanan   Wildan
 ├─ feature/android          Wildan
 ├─ feature/daftar-makanan   Anggita
 └─ feature/admin-panel      Anggita
```
Aturan: **tidak ada yang commit langsung ke `main`**. Setiap fitur di branch sendiri, digabung lewat Pull Request.
Aktifkan perlindungan: **Settings > Branches > Add rule** untuk `main`, centang **Require a pull request before merging** dan **Require approvals: 1**.

## F. Alur kerja harian (ulangi untuk setiap fitur)

1. **Ambil kode terbaru**
   ```
   git checkout main
   git pull origin main
   ```
2. **Buat branch fitur**
   ```
   git checkout -b feature/login
   ```
3. **Kerjakan dan commit sering** (satu perubahan logis = satu commit)
   ```
   git add app/controllers/auth.js
   git commit -m "feat(auth): tambah login dengan password_verify dan sesi 30 menit"
   ```
4. **Unggah branch**
   ```
   git push -u origin feature/login
   ```
5. **Pull Request**: di GitHub muncul tombol **Compare & pull request**. Judul jelas, isi templat (ringkasan, issue terkait `Closes #3`, cara uji, daftar periksa). Pilih **Reviewers**: satu anggota lain.
6. **Code review** oleh anggota lain: buka tab **Files changed**, beri komentar per baris, lalu **Review changes > Approve** atau **Request changes**. Periksa: penamaan, duplikasi, keamanan (prepared statement), hasil uji.
7. **Merge**: setelah disetujui, **Merge pull request**, lalu **Delete branch**.
8. **Sinkronkan lokal**
   ```
   git checkout main
   git pull origin main
   git branch -d feature/login
   ```

## G. Pesan commit yang baik

Format: `jenis(ruang): ringkasan singkat dalam kalimat perintah`.

| Jenis | Dipakai untuk |
|-------|---------------|
| `feat` | fitur baru |
| `fix` | perbaikan bug |
| `docs` | dokumen |
| `test` | uji |
| `refactor` | merapikan tanpa mengubah perilaku |
| `chore` | pekerjaan pendukung (konfigurasi, .gitignore) |

| Baik | Buruk |
|------|-------|
| `fix(status): batas Mendekati kini sisa tepat 3 hari` | `update` |
| `feat(makanan): validasi tanggal kadaluarsa tidak boleh lampau` | `perubahan baru` |
| `test: tambah uji BVA tentukanStatus` | `asdf` |

## H. Bekerja bersama dan konflik

Bila `git push` ditolak ("rejected ... fetch first") atau PR menunjukkan **conflicts**:

```
git checkout feature/login
git fetch origin
git merge origin/main
```
Git menandai berkas konflik. Buka berkas itu, cari penanda:
```
<<<<<<< HEAD
(kode Anda)
=======
(kode dari main)
>>>>>>> origin/main
```
Putuskan isi akhir (boleh gabungan), **hapus ketiga baris penanda**, lalu:
```
git add nama-berkas
git commit -m "merge: selesaikan konflik dengan main"
git push
```

**Latihan konflik untuk dokumentasi Tugas 11** (sengaja dibuat, disarankan didokumentasikan dengan tangkapan layar):
1. Rudy dan Anggita mengedit baris yang sama di `README.md` pada dua branch berbeda.
2. Rudy merge lebih dulu. Anggita membuka PR dan GitHub menampilkan konflik.
3. Anggita menyelesaikannya dengan langkah di atas dan PR berhasil digabung.

## I. Perintah penting lain

| Tujuan | Perintah |
|--------|----------|
| Status berkas | `git status` |
| Riwayat ringkas | `git log --oneline --graph --all` |
| Lihat perubahan | `git diff` |
| Batalkan perubahan berkas yang belum di-add | `git restore nama-berkas` |
| Keluarkan berkas dari staging | `git restore --staged nama-berkas` |
| Perbaiki pesan commit terakhir (belum di-push) | `git commit --amend` |
| Batalkan commit dengan aman (sudah di-push) | `git revert <kode-commit>` |
| Simpan sementara pekerjaan | `git stash` lalu `git stash pop` |
| Pindah branch | `git checkout nama-branch` |
| Daftar branch | `git branch -a` |

Hindari `git push --force` dan `git reset --hard` pada branch bersama.

## J. Issues dan Project board (menghubungkan Tugas 13)

1. **Issues > New issue** untuk setiap user story/tugas ([07](07_Manajemen-Proyek.md)), beri label (`fitur`, `bug`, `dokumen`) dan **Assignee**.
2. **Projects > New project > Board**: kolom **Backlog, Sprint Backlog, In Progress, In Review, Done**. Tambahkan issue ke board.
3. Di PR tulis `Closes #nomor` agar issue tertutup otomatis saat merge.
4. **Milestones** untuk Sprint 1, 2, 3 dengan tanggal tenggat.

## K. README, .gitignore, dan lisensi

- `README.md` sudah tersedia (deskripsi, tim, cara menjalankan, struktur folder). Sesuaikan nama pengguna dan tangkapan layar.
- `.gitignore` sudah tersedia. Periksa bahwa `data/`, `node/`, dan `app/node_modules/` tidak terlacak: `git ls-files | findstr /i "node_modules chillguard.db node.exe"` harus kosong.
- Lisensi opsional: **Add file > Create new file > LICENSE** (pilih templat MIT).

## L. GitHub Releases (bagikan zip dan APK)

1. Selesaikan zip dengan [08](08_ZIP-Final-dan-Hari-Penilaian.md) dan APK dengan [04](04_Aplikasi-Android.md).
2. Di repo: **Releases > Draft a new release**. Tag `v1.0`, judul "Chill Guard v1.0 portable".
3. Seret `ChillGuard-Portable.zip` dan `chillguard.apk` ke kotak **Attach binaries** (batas 2 GB per berkas). **Publish release**.
4. Cadangan saat penilaian: unduh zip dari Release bila flashdisk bermasalah (butuh internet).

## M. Daftar bukti untuk laporan Tugas 11

- [ ] Tangkapan layar repository (README tampil) dan daftar anggota di Collaborators
- [ ] Daftar branch fitur
- [ ] Riwayat commit (`git log --oneline --graph --all`) dari tiga anggota
- [ ] Minimal satu Pull Request dengan review dan komentar
- [ ] Contoh penyelesaian konflik
- [ ] Issues dan board Project
- [ ] Release berisi zip dan APK

Lanjut ke [06. Pengujian black-box dan white-box](06_Pengujian-BlackBox-WhiteBox.md).
