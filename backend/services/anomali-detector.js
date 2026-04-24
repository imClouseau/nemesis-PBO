// backend/services/anomaly-detector.js
// Deteksi anomali anggaran menggunakan metode statistik

const db = require('../db');

// ─── Z-Score: deteksi pagu tidak wajar per kategori ───
function calculateZScore(values) {
  const n = values.length;
  if (n < 3) return values.map(() => 0);

  const mean = values.reduce((a,b) => a+b, 0) / n;
  const variance = values.reduce((a,b) => a + Math.pow(b-mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return values.map(v => stdDev === 0 ? 0 : (v - mean) / stdDev);
}

// ─── IQR: deteksi outlier robust ───
function detectIQROutliers(values, multiplier=1.5) {
  const sorted = [...values].sort((a,b) => a-b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const upper = q3 + multiplier * iqr;

  return values.map(v => ({ isOutlier: v > upper, value: v, threshold: upper }));
}

// ─── Deteksi pemecahan paket (splitting) ───
function detectPacketSplitting(paketList) {
  const WINDOW_DAYS = 30;
  const MAX_SINGLE = 200_000_000;  // ambang pengadaan langsung
  const SIMILAR_THRESHOLD = 0.7;   // 70% similarity judul

  const suspicious = [];

  paketList.forEach((paket, i) => {
    if (paket.pagu >= MAX_SINGLE) return;

    const similar = paketList.filter((p, j) => {
      if (i === j) return false;
      if (p.satker !== paket.satker) return false;

      // Hitung similarity sederhana: kata yang sama / total kata
      const words1 = paket.paket.toLowerCase().split(' ');
      const words2 = p.paket.toLowerCase().split(' ');
      const common = words1.filter(w => words2.includes(w)).length;
      const similarity = common / Math.max(words1.length, words2.length);

      return similarity >= SIMILAR_THRESHOLD;
    });

    if (similar.length >= 3) {
      suspicious.push({
        paket: paket.paket,
        satker: paket.satker,
        count: similar.length + 1,
        totalPagu: similar.reduce((a,p) => a+p.pagu, paket.pagu),
        jenis: 'PEMECAHAN_PAKET',
        severity: similar.length >= 5 ? 'critical' : 'warning',
      });
    }
  });

  return suspicious;
}

// ─── Fungsi utama: analisis semua anomali Kota Bandung ───
async function analyzeAnomaliesBandung() {
  const paket = db.prepare(`
    SELECT id, paket, satker, pagu, jenisPengadaan,
           tags_isInappropriate as level, potensiPemborosan
    FROM paket
    WHERE UPPER(lokasi) LIKE '%KOTA BANDUNG%'
  `).all();

  // Group by jenis pengadaan untuk Z-Score
  const byJenis = {};
  paket.forEach(p => {
    const key = p.jenisPengadaan || 'LAINNYA';
    if (!byJenis[key]) byJenis[key] = [];
    byJenis[key].push(p);
  });

  const anomalies = [];

  // Hitung Z-Score per kategori
  Object.entries(byJenis).forEach(([jenis, items]) => {
    const pagus = items.map(p => p.pagu);
    const zScores = calculateZScore(pagus);
    const iqr = detectIQROutliers(pagus);

    items.forEach((item, i) => {
      const z = zScores[i];
      if (Math.abs(z) > 2.0) {
        anomalies.push({
          ...item,
          zScore: parseFloat(z.toFixed(2)),
          isIQROutlier: iqr[i].isOutlier,
          anomalyType: 'PAGU_TIDAK_WAJAR',
          severity: z > 3.5 ? 'critical' : 'warning',
        });
      }
    });
  });

  // Deteksi pemecahan paket
  const splitting = detectPacketSplitting(paket);
  anomalies.push(...splitting);

  // Urutkan: critical dulu, lalu warning
  anomalies.sort((a,b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return (b.zScore||0) - (a.zScore||0);
  });

  return anomalies;
}

module.exports = { analyzeAnomaliesBandung };
