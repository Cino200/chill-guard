'use strict';
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

module.exports = {
  APP_NAMA: 'Chill Guard',
  ROOT,
  PORT_AWAL: Number(process.env.CG_PORT) || 8080,
  // Data (database + foto) disimpan di folder data\ di sebelah aplikasi, ikut terbawa di flashdisk
  FOLDER_DATA: process.env.CG_DATA || path.join(ROOT, 'data'),
  SESI_TIMEOUT_MS: (Number(process.env.CG_SESI_DETIK) || 30 * 60) * 1000,   // logout otomatis 30 menit tidak aktif
  FOTO_MAKS_BYTE: 2 * 1024 * 1024,          // foto maks. 2 MB (JPG/PNG)
  ZONA_WAKTU_JAM: 7,                        // WIB (UTC+7); tidak bergantung pada zona waktu Windows
};
