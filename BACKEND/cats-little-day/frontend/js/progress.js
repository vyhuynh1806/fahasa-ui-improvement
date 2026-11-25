import { api } from './api.js';
import { initializeLayout, todayISO, toast, updateCoins, prettyDate } from './shared.js';

initializeLayout();
const $ = (query) => document.querySelector(query);

function fallbackChart(weekly) {
  const element = $('#fallbackChart');
  const largest = Math.max(1, ...weekly.map((d) => d.total));
  element.innerHTML = weekly.map(({ date, completed, total }) => `
    <div class="fallback-column" title="${date}: ${completed} hoàn thành / ${total} tổng">
      <div class="fallback-bar" style="height:${Math.max(2, Math.round(completed / largest * 90))}%"></div>
      <small>${prettyDate(date)}</small>
    </div>`).join('');
  $('#weeklyChart').classList.add('hidden');
  element.classList.remove('hidden');
}

function renderChart(weekly) {
  if (!window.Chart) return fallbackChart(weekly);
  new window.Chart($('#weeklyChart'), {
    type: 'bar',
    data: {
      labels: weekly.map((day) => prettyDate(day.date)),
      datasets: [
        { label: 'Tổng công việc', data: weekly.map((day) => day.total), backgroundColor: '#ead8c7', borderRadius: 8, borderSkipped: false },
        { label: 'Đã hoàn thành', data: weekly.map((day) => day.completed), backgroundColor: '#88b995', borderRadius: 8, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 9, color: '#879889', padding: 18, font: { family: 'Nunito', size: 11, weight: 'bold' } } }, tooltip: { backgroundColor: '#577b62', padding: 10 } },
      scales: { x: { grid: { display: false }, ticks: { color: '#9da79b', font: { size: 10, family: 'Nunito' } }, border: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0, stepSize: 1, color: '#9da79b' }, border: { display: false }, grid: { color: '#f0f1e8' } } }
    }
  });
}

async function start() {
  try {
    const { stats } = await api.stats(todayISO());
    $('#totalTasks').textContent = stats.total;
    $('#completedTasks').textContent = stats.completed;
    $('#pendingTasks').textContent = stats.pending;
    $('#totalCoins').textContent = stats.coins;
    $('#globalPercent').textContent = `${stats.completionRate}%`;
    $('#globalProgressBar').style.width = `${stats.completionRate}%`;
    $('#achievementMessage').textContent = stats.total === 0 ? 'Bắt đầu từ một việc nhỏ hôm nay nhé!' :
      stats.completionRate === 100 ? 'Hoàn hảo luôn! Hãy tự thưởng cho mình một ngày thật vui 🌼' :
      `Bạn đã hoàn thành ${stats.completed} việc. Miu tin bạn sẽ làm được!`;
    updateCoins(stats.coins);
    renderChart(stats.weekly);
  } catch (error) {
    $('#achievementMessage').textContent = 'Không thể tải thống kê. Hãy kiểm tra máy chủ.';
    toast(error.message, true);
  }
}

start();
