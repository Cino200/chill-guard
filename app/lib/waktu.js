'use strict';
/**
 * Fungsi inti Chill Guard: sisa waktu dan status makanan.
 * Dasar rancangan: Tugas 2 (KB-11, KB-12), Tugas 5 (State Machine), Tugas 6 (Class Diagram).
 *
 * Aturan status (Tugas 5):
 *   sisa < 0                    -> kadaluarsa
 *   0 <= sisa <= 3 hari         -> mendekati
 *   sisa > 3 hari               -> aman
 *
 * Semua waktu disimpan sebagai teks WIB "YYYY-MM-DD HH:MM:SS" dan dihitung dengan
 * offset tetap +07:00, sehingga hasilnya sama di komputer mana pun.
 */
const WIB_MS = 7 * 3600 * 1000;
const BATAS_MENDEKATI_DETIK = 3 * 86400;

/** Epoch ms -> teks WIB "YYYY-MM-DD HH:MM:SS". */
function formatWib(ms) {
  return new Date(ms + WIB_MS).toISOString().slice(0, 19).replace('T', ' ');
}

/** Teks WIB "YYYY-MM-DD HH:MM[:SS]" -> epoch ms, atau null bila tidak valid (mis. 31 Februari). */
function parseWib(teks) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(teks));
  if (!m) return null;
  const [y, mo, d, h, mi, s] = [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0)];
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d
      || dt.getUTCHours() !== h || dt.getUTCMinutes() !== mi || dt.getUTCSeconds() !== s) return null;
  return dt.getTime() - WIB_MS;
}

/** Sisa detik dari sekarang sampai tanggal kadaluarsa. Negatif = sudah lewat. */
function hitungSisaDetik(tanggalKadaluarsa, sekarangMs = Date.now()) {
  return Math.floor(parseWib(tanggalKadaluarsa) / 1000) - Math.floor(sekarangMs / 1000);
}

/** Tiga jalur: kadaluarsa (A), mendekati (B), aman (C). */
function tentukanStatus(sisaDetik) {
  if (sisaDetik < 0) return 'kadaluarsa';                    // keputusan A
  if (sisaDetik <= BATAS_MENDEKATI_DETIK) return 'mendekati'; // keputusan B
  return 'aman';                                             // jalur C
}

/** "Sisa 13 Jam", "Sisa 15 Hari", "Kadaluarsa". */
function formatSisaWaktu(sisaDetik) {
  if (sisaDetik < 0) return 'Kadaluarsa';
  if (sisaDetik < 86400) return 'Sisa ' + Math.floor(sisaDetik / 3600) + ' Jam';
  return 'Sisa ' + Math.floor(sisaDetik / 86400) + ' Hari';
}

/** Urut dari sisa waktu paling sedikit (paling mendesak). Tugas 4: urutkanPrioritas(). */
function urutkanPrioritas(daftar) {
  return [...daftar].sort((a, b) => a.sisa_detik - b.sisa_detik);
}

module.exports = {
  BATAS_MENDEKATI_DETIK, WIB_MS, formatWib, parseWib,
  hitungSisaDetik, tentukanStatus, formatSisaWaktu, urutkanPrioritas,
};
