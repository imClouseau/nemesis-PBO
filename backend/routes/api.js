// backend/routes/api.js
const config = require('../config/bandung');
const express = require('express');
const router = express.Router();
const db = require('../db');  // koneksi SQLite

// ─── Helper: WHERE clause untuk filter Kota Bandung ───
const BANDUNG_WHERE = `
  WHERE (
    UPPER(lokasi) LIKE '%KOTA BANDUNG%'
    OR UPPER(lembaga) LIKE '%KOTA BANDUNG%'
  )
`;

// ─── GET /api/paket — daftar paket dengan filter ───
router.get('/paket', (req, res) => {
  const { level, satker, limit=50, offset=0 } = req.query;

  let where = BANDUNG_WHERE;
  const params = [];

  // Filter tambahan: level klasifikasi AI
  if (level && ['low','med','high','absurd'].includes(level)) {
    where += ` AND tags_isInappropriate = ?`;
    params.push(level);
  }

  // Filter tambahan: nama satker
  if (satker) {
    where += ` AND UPPER(satker) LIKE ?`;
    params.push(`%${satker.toUpperCase()}%`);
  }

  const paket = db.prepare(`
    SELECT id, paket, satker, lokasi, pagu,
           tags_isInappropriate as level,
           potensiPemborosan,
           tags_inappropriateReason as alasan
    FROM paket ${where}
    ORDER BY pagu DESC
    LIMIT ? OFFSET ?
  `).all([...params, parseInt(limit), parseInt(offset)]);

  const total = db.prepare(`
    SELECT COUNT(*) as n FROM paket ${where}
  `).get(params).n;

  res.json({ data: paket, total, daerah: config.NAMA_DAERAH });
});

// ─── GET /api/statistik — ringkasan statistik Kota Bandung ───
router.get('/statistik', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_paket,
      SUM(pagu) as total_pagu,
      SUM(CASE WHEN tags_isInappropriate IN ('high','absurd') THEN 1 ELSE 0 END) as anomali,
      SUM(potensiPemborosan) as total_pemborosan,
      SUM(CASE WHEN isUMKM = 1 THEN 1 ELSE 0 END) as umkm_count
    FROM paket ${BANDUNG_WHERE}
  `).get();

  res.json({ ...stats, daerah: config.NAMA_DAERAH, kode: config.KODE_KLPD });
});

// ─── GET /api/satker — daftar satker dan statistiknya ───
router.get('/satker', (req, res) => {
  const satker = db.prepare(`
    SELECT satker,
      COUNT(*) as total,
      SUM(pagu) as pagu,
      SUM(CASE WHEN tags_isInappropriate IN ('high','absurd') THEN 1 ELSE 0 END) as anomali
    FROM paket ${BANDUNG_WHERE}
    GROUP BY satker ORDER BY pagu DESC LIMIT 20
  `).all();

  res.json({ data: satker });
});

module.exports = router;

const { analyzeAnomaliesBandung } = require('../services/anomaly-detector');

// GET /api/anomali — daftar anomali terdeteksi
router.get('/anomali', async (req, res) => {
  try {
    const anomalies = await analyzeAnomaliesBandung();
    const { severity } = req.query;

    const filtered = severity
      ? anomalies.filter(a => a.severity === severity)
      : anomalies;

    res.json({
      data: filtered.slice(0, 50),
      total: filtered.length,
      critical: anomalies.filter(a => a.severity==='critical').length,
      warning: anomalies.filter(a => a.severity==='warning').length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { analyzeUMKMOpportunity } = require('../services/umkm-matcher');

// GET /api/umkm — analisis peluang UMKM Kota Bandung
router.get('/umkm', (req, res) => {
  const result = analyzeUMKMOpportunity();
  res.json(result);
});
