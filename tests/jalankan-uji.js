'use strict';
/**
 * Skrip uji Chill Guard (tanpa framework, tanpa database).
 * Bagian 1-4 : uji BLACK-BOX (equivalence partitioning, boundary value analysis, decision table)
 * Bagian 5   : uji WHITE-BOX (cakupan percabangan / branch coverage)
 *
 * Jalankan:  jalankan-uji.bat   atau   node tests\jalankan-uji.js
 */
const W = require('../app/lib/waktu');
const V = require('../app/lib/validasi');

const SEKARANG = W.parseWib('2026-11-15 12:00:00');   // waktu tetap agar hasil selalu sama
const HARI = 86400;
let gagal = 0;
let total = 0;
const kodeTerjadi = { status: new Set(), validasi: new Set(), hapusAkun: new Set() };

const garis = (lebar) => '+' + lebar.map((w) => '-'.repeat(w + 2)).join('+') + '+\n';
const baris = (sel, lebar) => '|' + sel.map((t, i) => ' ' + String(t).padEnd(lebar[i]) + ' ').join('|') + '|\n';

function cetakTabel(judul, kasus) {
  const lebar = [8, 46, 26, 26, 6];
  let o = `\n=== ${judul} ===\n` + garis(lebar) + baris(['ID', 'Skenario / Input', 'Diharapkan', 'Aktual', 'Hasil'], lebar) + garis(lebar);
  for (const [id, skenario, diharapkan, aktual] of kasus) {
    const lulus = String(diharapkan) === String(aktual);
    total += 1;
    if (!lulus) gagal += 1;
    o += baris([id, skenario, diharapkan, aktual, lulus ? 'PASS' : 'FAIL'], lebar);
  }
  process.stdout.write(o + garis(lebar));
}

// 1. BLACK-BOX: status makanan (Boundary Value Analysis pada batas 3 hari dan 0)
const dataStatus = [
  ['BB-ST-01', 'Sisa 15 hari', 15 * HARI, 'aman'],
  ['BB-ST-02', 'Sisa 3 hari + 1 detik', 3 * HARI + 1, 'aman'],
  ['BB-ST-03', 'Sisa tepat 3 hari (batas)', 3 * HARI, 'mendekati'],
  ['BB-ST-04', 'Sisa 3 hari - 1 detik', 3 * HARI - 1, 'mendekati'],
  ['BB-ST-05', 'Sisa 13 jam', 13 * 3600, 'mendekati'],
  ['BB-ST-06', 'Sisa 1 detik', 1, 'mendekati'],
  ['BB-ST-07', 'Sisa tepat 0 detik (batas)', 0, 'mendekati'],
  ['BB-ST-08', 'Sisa -1 detik (baru lewat)', -1, 'kadaluarsa'],
  ['BB-ST-09', 'Sisa -1 hari', -HARI, 'kadaluarsa'],
];
cetakTabel('BLACK-BOX 1: tentukanStatus() - Boundary Value Analysis', dataStatus.map(([id, s, detik, hrp]) => {
  const aktual = W.tentukanStatus(detik);
  kodeTerjadi.status.add(aktual);
  return [id, s, hrp, aktual];
}));

// 2. BLACK-BOX: hitung dan tampilan sisa waktu
cetakTabel('BLACK-BOX 2: hitungSisaDetik(), formatSisaWaktu(), urutkanPrioritas()', [
  ['BB-WK-01', 'Kadaluarsa = sekarang + 13 jam', 'Sisa 13 Jam', W.formatSisaWaktu(W.hitungSisaDetik('2026-11-16 01:00:00', SEKARANG))],
  ['BB-WK-02', 'Kadaluarsa = sekarang + 15 hari', 'Sisa 15 Hari', W.formatSisaWaktu(W.hitungSisaDetik('2026-11-30 12:00:00', SEKARANG))],
  ['BB-WK-03', 'Kadaluarsa = kemarin', 'Kadaluarsa', W.formatSisaWaktu(W.hitungSisaDetik('2026-11-14 12:00:00', SEKARANG))],
  ['BB-WK-04', 'Sisa 86399 detik (23 jam 59 mnt)', 'Sisa 23 Jam', W.formatSisaWaktu(86399)],
  ['BB-WK-05', 'Sisa 86400 detik (tepat 1 hari)', 'Sisa 1 Hari', W.formatSisaWaktu(86400)],
  ['BB-WK-06', 'Urutan prioritas: sisa [5h, 1h, -2h]', '-7200,3600,432000',
    W.urutkanPrioritas([{ sisa_detik: 5 * HARI }, { sisa_detik: 3600 }, { sisa_detik: -7200 }]).map((x) => x.sisa_detik).join(',')],
  // Perawatan corrective (Tugas 14): sisa kurang dari 1 jam tidak boleh tampil "Sisa 0 Jam"
  ['BB-WK-07', 'Sisa 3599 detik (59 mnt 59 dtk)', 'Sisa 59 Menit', W.formatSisaWaktu(3599)],
  ['BB-WK-08', 'Sisa 1800 detik (30 menit)', 'Sisa 30 Menit', W.formatSisaWaktu(1800)],
  ['BB-WK-09', 'Sisa 59 detik', 'Sisa < 1 Menit', W.formatSisaWaktu(59)],
  ['BB-WK-10', 'Sisa tepat 0 detik (batas)', 'Sisa < 1 Menit', W.formatSisaWaktu(0)],
  ['BB-WK-11', 'Sisa 3600 detik (regresi: tepat 1 jam)', 'Sisa 1 Jam', W.formatSisaWaktu(3600)],
]);

// 3. BLACK-BOX: form Tambah Makanan (Equivalence Partitioning)
const f = (nama, kulkas, tgl) => ({ nama_makanan: nama, kulkas_id: kulkas, tanggal_kadaluarsa: tgl });
const dataTambah = [
  ['BB-TM-01', 'Data lengkap dan valid', f('Nasi Kotak', 6, '2026-11-16 01:00'), 'OK'],
  ['BB-TM-02', 'Nama kosong', f('', 6, '2026-11-16 01:00'), 'NAMA_KOSONG'],
  ['BB-TM-03', 'Nama hanya spasi', f('   ', 6, '2026-11-16 01:00'), 'NAMA_KOSONG'],
  ['BB-TM-04', 'Kulkas belum dipilih (0)', f('Roti', 0, '2026-11-16 01:00'), 'KULKAS_KOSONG'],
  ['BB-TM-05', 'Tanggal kosong', f('Roti', 6, ''), 'FORMAT_TANGGAL'],
  ['BB-TM-06', 'Tanggal teks "besok"', f('Roti', 6, 'besok'), 'FORMAT_TANGGAL'],
  ['BB-TM-07', 'Tanggal tidak ada (31 Februari)', f('Roti', 6, '2027-02-31 10:00'), 'FORMAT_TANGGAL'],
  ['BB-TM-08', 'Tanggal masa lalu (kemarin)', f('Roti', 6, '2026-11-14 12:00'), 'TANGGAL_LALU'],
  ['BB-TM-09', 'Batas: 1 menit sebelum sekarang', f('Roti', 6, '2026-11-15 11:59'), 'TANGGAL_LALU'],
  ['BB-TM-10', 'Batas: tepat sekarang (diizinkan)', f('Roti', 6, '2026-11-15 12:00'), 'OK'],
];
cetakTabel('BLACK-BOX 3: validasiTambahMakanan() - Equivalence Partitioning + batas', dataTambah.map(([id, s, masukan, hrp]) => {
  const h = V.validasiTambahMakanan(masukan, SEKARANG);
  kodeTerjadi.validasi.add(h.kode);
  return [id, s, hrp, h.kode];
}));

// 4. BLACK-BOX: keputusan Hapus Akun (Decision Table)
const pegawai = { role: 'pegawai' };
const admin = { role: 'admin' };
const dataHapus = [
  ['BB-HA-01', 'Akun tidak ditemukan', [null, 1, true, false], 'AKUN_TIDAK_ADA'],
  ['BB-HA-02', 'Admin terakhir dihapus (1 admin)', [admin, 1, true, false], 'ADMIN_TERAKHIR'],
  ['BB-HA-03', 'Admin dihapus, masih ada admin lain (2)', [admin, 2, true, true], 'OK'],
  ['BB-HA-04', 'Pegawai hapus akun sendiri, password salah', [pegawai, 1, false, false], 'PASSWORD_SALAH'],
  ['BB-HA-05', 'Pegawai hapus akun sendiri, password benar', [pegawai, 1, true, false], 'OK'],
  ['BB-HA-06', 'Admin menghapus pegawai (tanpa password)', [pegawai, 1, false, true], 'OK'],
];
cetakTabel('BLACK-BOX 4: putuskanHapusAkun() - Decision Table', dataHapus.map(([id, s, arg, hrp]) => {
  const h = V.putuskanHapusAkun(...arg);
  kodeTerjadi.hapusAkun.add(h.kode);
  return [id, s, hrp, h.kode];
}));

// 5. WHITE-BOX: cakupan percabangan (branch coverage)
// Kode jalur yang benar-benar dilewati dicatat dari eksekusi di atas. Keluar di keputusan ke-i berarti
// keputusan 1..i-1 bernilai False dan keputusan ke-i bernilai True.
function laporCakupan(fungsi, urut, kodeAkhir, terjadi) {
  const lebar = [24, 8, 10];
  let o = `\n--- ${fungsi} ---\n` + garis(lebar) + baris(['Keputusan', 'Hasil', 'Tercakup'], lebar) + garis(lebar);
  const tercakup = new Set();
  for (const kode of terjadi) {
    const i = urut.indexOf(kode);
    if (i === -1) { urut.forEach((k) => tercakup.add(k + '|False')); continue; }   // jalur akhir
    for (let j = 0; j < i; j += 1) tercakup.add(urut[j] + '|False');
    tercakup.add(kode + '|True');
  }
  let jumlah = 0;
  let semua = 0;
  for (const k of urut) {
    for (const nilai of ['True', 'False']) {
      semua += 1;
      const ya = tercakup.has(k + '|' + nilai);
      if (ya) jumlah += 1;
      o += baris([k, nilai, ya ? 'Ya' : 'TIDAK'], lebar);
    }
  }
  o += garis(lebar);
  o += `Branch coverage    : ${jumlah}/${semua} (${Math.round((jumlah / semua) * 100)}%)\n`;
  o += `Statement (return) : ${terjadi.size}/${urut.length + 1} jalur keluar dieksekusi (kode akhir: ${kodeAkhir})\n`;
  process.stdout.write(o);
  return jumlah === semua;
}

process.stdout.write('\n\n##### WHITE-BOX: BRANCH COVERAGE (dihitung dari eksekusi black-box di atas) #####\n');
const penuh = [
  laporCakupan('tentukanStatus()', ['kadaluarsa', 'mendekati'], 'aman', kodeTerjadi.status),
  laporCakupan('validasiTambahMakanan()', ['NAMA_KOSONG', 'KULKAS_KOSONG', 'FORMAT_TANGGAL', 'TANGGAL_LALU'], 'OK', kodeTerjadi.validasi),
  laporCakupan('putuskanHapusAkun()', ['AKUN_TIDAK_ADA', 'ADMIN_TERAKHIR', 'PASSWORD_SALAH'], 'OK', kodeTerjadi.hapusAkun),
].every(Boolean);

console.log(`\n===== RINGKASAN: ${total} test case, ${total - gagal} PASS, ${gagal} FAIL; cakupan cabang ${penuh ? '100%' : 'BELUM penuh'} =====`);
process.exit(gagal === 0 && penuh ? 0 : 1);
