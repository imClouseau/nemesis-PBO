// frontend/components/classification-chart.js
// Chart distribusi klasifikasi AI dari LLM

export async function renderClassificationChart(canvasId) {
  const res = await fetch('/api/paket?limit=9999');
  const { data } = await res.json();

  // Hitung distribusi klasifikasi
  const dist = { absurd:0, high:0, med:0, low:0 };
  data.forEach(p => { if (dist[p.level] !== undefined) dist[p.level]++; });

  // Total untuk hitung persentase
  const total = Object.values(dist).reduce((a,b) => a+b, 0);

  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Absurd', 'High', 'Medium', 'Low'],
      datasets: [{
        data: [dist.absurd, dist.high, dist.med, dist.low],
        backgroundColor: ['#DC2626','#D97706','#2563EB','#16A34A'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = ((ctx.raw/total)*100).toFixed(1);
              return `${ctx.raw} paket (${pct}%)`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}
