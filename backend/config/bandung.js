// backend/config/bandung.js
// Konfigurasi filter untuk Kota Bandung (Kode K/L/PD: D99)

module.exports = {
  // Kode utama Kota Bandung di SIRUP LKPP
  KODE_KLPD: 'D99',
  NAMA_DAERAH: 'Kota Bandung',

  // Filter field di database
  FILTER_FIELD: 'lokasi',
  FILTER_VALUE: 'KOTA BANDUNG',

  // Alternatif: filter berdasarkan nama K/L/PD
  KLPD_FIELD: 'lembaga',
  KLPD_VALUE: 'Kota Bandung',

  // Batas anomali untuk deteksi lokal
  ZSCORE_THRESHOLD: 2.0,
  IQR_MULTIPLIER: 1.5,

  // Kode satker Kota Bandung (untuk filter lebih spesifik)
  SATKER_CODES: ['102501','102502','102503','102504','102505','102506'],
};
