// Mencocokkan paket pengadaan dengan sektor UMKM Kota Bandung

const db = require('../db');
const umkmData = require('../data/umkm-bandung.json');

// Cocokkan judul paket dengan keyword UMKM
function matchUMKMSector(judulPaket) {
  const judul = judulPaket.toLowerCase();

  for (const sektor of umkmData.sektors) {
    const matched = sektor.keywords_pengadaan.some(kw => judul.includes(kw));
    if (matched) return sektor;
  }
  return null;
}

// Analisis peluang UMKM untuk Kota Bandung
function analyzeUMKMOpportunity() {
  // Paket yang sudah di-flag isUMKM dari SIRUP
  const paketUMKM = db.prepare(`
    SELECT id, paket, satker, pagu, isUMKM
    FROM paket
    WHERE UPPER(lokasi) LIKE '%KOTA BANDUNG%'
      AND isUMKM = 1
  `).all();

  // Paket yang relevan tapi belum di-flag UMKM
  const semuaPaket = db.prepare(`
    SELECT id, paket, satker, pagu
    FROM paket
    WHERE UPPER(lokasi) LIKE '%KOTA BANDUNG%'
      AND (isUMKM IS NULL OR isUMKM = 0)
  `).all();

  // Cek paket yang belum di-flag tapi sebenarnya cocok untuk UMKM
  const potensiUMKM = semuaPaket.filter(p => matchUMKMSector(p.paket) !== null);

  // Agregasi per sektor
  const sektorStats = umkmData.sektors.map(sektor => {
    const paketSektor = paketUMKM.filter(p => {
      const matched = matchUMKMSector(p.paket);
      return matched && matched.id === sektor.id;
    });

    const totalPagu = paketSektor.reduce((a,p) => a+p.pagu, 0);

    return {
      ...sektor,
      paket_count: paketSektor.length,
      total_pagu: totalPagu,
      realisasi_persen: sektor.nilai_potensi_juta > 0
        ? ((totalPagu/1e6) / sektor.nilai_potensi_juta * 100).toFixed(1)
        : 0,
    };
  });

  return {
    sudah_umkm: paketUMKM.length,
    potensi_belum_flag: potensiUMKM.length,
    total_nilai_umkm: paketUMKM.reduce((a,p) => a+p.pagu, 0),
    sektors: sektorStats,
    meta: umkmData,
  };
}

module.exports = { analyzeUMKMOpportunity, matchUMKMSector };
