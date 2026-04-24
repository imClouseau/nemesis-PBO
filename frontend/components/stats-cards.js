// frontend/components/stats-cards.js
// Komponen kartu statistik ringkasan Kota Bandung

export async function renderStatsCards(container) {
  // Ambil data dari API backend
  const res = await fetch('/api/statistik');
  const { total_paket, total_pagu, anomali, total_pemborosan, umkm_count }
    = await res.json();

  // Format angka ke format Rupiah yang mudah dibaca
  const formatRupiah = (n) => {
    if (n >= 1e12) return `Rp ${(n/1e12).toFixed(2)} T`;
    if (n >= 1e9)  return `Rp ${(n/1e9).toFixed(1)} M`;
    if (n >= 1e6)  return `Rp ${(n/1e6).toFixed(0)} Jt`;
    return `Rp ${n.toLocaleString('id-ID')}`;
  };

  // Render HTML kartu
  container.innerHTML = `
    <div class='stats-grid'>
      <div class='stat-card'>
        <div class='stat-label'>Total Paket RUP</div>
        <div class='stat-value'>${total_paket.toLocaleString('id-ID')}</div>
        <div class='stat-sub'>Kota Bandung 2025</div>
      </div>
      <div class='stat-card warn'>
        <div class='stat-label'>Total Pagu Anggaran</div>
        <div class='stat-value'>${formatRupiah(total_pagu)}</div>
        <div class='stat-sub'>Nilai pengadaan</div>
      </div>
      <div class='stat-card danger'>
        <div class='stat-label'>Terindikasi Anomali</div>
        <div class='stat-value'>${anomali} paket</div>
        <div class='stat-sub'>Perlu investigasi lanjut</div>
      </div>
      <div class='stat-card success'>
        <div class='stat-label'>Relevan UMKM</div>
        <div class='stat-value'>${umkm_count} paket</div>
        <div class='stat-sub'>Peluang serapan lokal</div>
      </div>
    </div>
  `;
}
