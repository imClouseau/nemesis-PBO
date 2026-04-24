// Tambahkan di frontend/components/satker-chart.js
export async function renderSatkerChart(canvasId) {
  const res = await fetch('/api/satker');
  const { data } = await res.json();

  // Ambil top 10 satker berdasarkan pagu
  const top10 = data.slice(0, 10);

  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top10.map(s => s.satker.substring(0, 25) + '...'),
      datasets: [
        {
          label: 'Total Pagu (Juta)',
          data: top10.map(s => Math.round(s.pagu / 1e6)),
          backgroundColor: '#2563EB',
          borderRadius: 4,
        },
        {
          label: 'Jumlah Anomali',
          data: top10.map(s => s.anomali),
          backgroundColor: '#DC2626',
          borderRadius: 4,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        y: { ticks: { font: { size: 11 } } },
        y1: { position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });
}
