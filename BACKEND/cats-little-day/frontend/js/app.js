import { api } from './api.js';
import { initializeLayout, todayISO, toast, escapeHTML, updateCoins, setLoading } from './shared.js';

initializeLayout();
const $ = (selector) => document.querySelector(selector);
const moodInfo = {
  happy: { image: 'cat-happy.svg', title: 'Miu đang vui vẻ!', subtitle: 'Bé đang chờ bạn chơi cùng', icon: '💗', speech: 'Meow~ Một ngày thật xinh! ♡', alt: 'Miu đang vui vẻ' },
  sleepy: { image: 'cat-sleepy.svg', title: 'Miu đang lim dim...', subtitle: 'Suỵt, bé đang ngủ một chút', icon: '🌙', speech: 'Zzz... Ngủ ngon nhé... ♡', alt: 'Miu đang ngủ ngon' },
  hungry: { image: 'cat-hungry.svg', title: 'Miu hơi đói rồi!', subtitle: 'Bé mong có chút đồ ăn', icon: '🍓', speech: 'Meow~ Miu đói bụng quá!', alt: 'Miu đang đói' }
};

function renderCat(cat) {
  updateCoins(cat.coins);
  const info = moodInfo[cat.mood] || moodInfo.happy;
  $('#catImage').src = `assets/${info.image}`;
  $('#catImage').alt = info.alt;
  $('#catImage').classList.toggle('is-sleeping', cat.mood === 'sleepy');
  $('#moodIcon').textContent = info.icon;
  $('#moodText').textContent = info.title;
  $('#moodSubtitle').textContent = info.subtitle;
  $('#catSpeech').textContent = info.speech;
  $('#hungerBar').style.width = `${cat.hunger}%`;
  $('#hungerValue').textContent = `${cat.hunger}%`;
  $('#napCat').textContent = cat.mood === 'sleepy' ? '☀️ Đánh thức' : '🌙 Cho ngủ';
  $('#feedCat').title = cat.coins < 20 ? 'Bạn cần hoàn thành thêm công việc để nhận xu' : 'Cho Miu ăn hết 20 xu';
}

function rewardAnimation(symbols = ['🪙','✨','💗']) {
  const area = $('#gardenParticles');
  const center = $('#catImage');
  center.classList.remove('is-bouncing');
  void center.offsetWidth;
  center.classList.add('is-bouncing');
  for (let i = 0; i < 11; i++) {
    const particle = document.createElement('span');
    particle.className = 'sparkle-particle';
    particle.textContent = symbols[i % symbols.length];
    particle.style.left = `${31 + Math.random() * 38}%`;
    particle.style.top = `${50 + Math.random() * 28}%`;
    particle.style.setProperty('--dx', `${(Math.random() - .5) * 130}px`);
    particle.style.animationDelay = `${i * 65}ms`;
    area.appendChild(particle);
    setTimeout(() => particle.remove(), 2000);
  }
}

function taskRow(task) {
  return `<div class="home-task-row ${task.status ? 'is-done' : ''}">
    <label><input class="task-check" type="checkbox" data-task-id="${task.id}" ${task.status ? 'checked' : ''} aria-label="Hoàn thành ${escapeHTML(task.title)}">
      <span class="task-text">${escapeHTML(task.title)}</span></label><span class="task-time">${task.status ? 'Đã xong ✓' : '+10 xu ✨'}</span>
  </div>`;
}

async function refreshToday() {
  const [tasksData, statsData] = await Promise.all([
    api.tasks({ date: todayISO() }), api.stats(todayISO())
  ]);
  const list = tasksData.tasks;
  $('#homeTaskList').innerHTML = list.length
    ? list.slice(0, 5).map(taskRow).join('')
    : `<div class="empty-state"><span class="empty-image">🌼</span><strong>Hôm nay vẫn là trang giấy trắng!</strong><p>Thử thêm một việc nhỏ để bắt đầu nhé.</p></div>`;
  const { total, completed, rate } = statsData.stats.today;
  $('#todayDonut').style.setProperty('--progress', `${rate}%`);
  $('#todayPercent').textContent = `${rate}%`;
  $('#todayDone').textContent = completed;
  $('#todayTotal').textContent = total;
  updateCoins(statsData.stats.coins);
}

async function init() {
  try {
    const catData = await api.cat();
    renderCat(catData.cat);
    await refreshToday();
  } catch (err) {
    $('#homeTaskList').innerHTML = `<div class="empty-state"><span class="empty-image">😿</span><strong>Không tải được sổ tay.</strong><p>Hãy chạy máy chủ và thử tải lại trang.</p></div>`;
    toast(err.message, true);
  }
}

const catActions = [
  ['#feedCat', api.feedCat, ['🍓','💗','✨']],
  ['#petCat', api.petCat, ['💗','✨','🌸']],
  ['#napCat', api.napCat, ['💤','🌙','✨']]
];
for (const [selector, action, symbols] of catActions) {
  $(selector).addEventListener('click', async (event) => {
    const button = event.currentTarget;
    setLoading(button, true);
    try {
      const response = await action();
      renderCat(response.cat);
      rewardAnimation(symbols);
      toast(response.message || 'Miu vui lắm!');
    } catch (err) { toast(err.message, true); }
    finally { setLoading(button, false); if (selector === '#napCat') {
      $('#napCat').textContent = $('#catImage').src.includes('sleepy') ? '☀️ Đánh thức' : '🌙 Cho ngủ';
    } }
  });
}

$('#homeTaskList').addEventListener('change', async (event) => {
  const input = event.target.closest('input[data-task-id]');
  if (!input) return;
  input.disabled = true;
  try {
    const response = await api.completeTask(input.dataset.taskId, input.checked);
    renderCat(response.cat);
    if (response.earned === 10) rewardAnimation();
    toast(response.earned > 0 ? '+10 xu! Bạn giỏi quá! ✨' : 'Đã cập nhật công việc và số xu.');
    await refreshToday();
  } catch (err) { input.checked = !input.checked; input.disabled = false; toast(err.message, true); }
});

$('#quickForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = $('#quickTitle');
  const button = form.querySelector('button');
  const title = input.value.trim();
  if (!title) return toast('Hãy nhập tên công việc nhé!', true);
  setLoading(button, true);
  try {
    await api.addTask({ title, description: '', task_date: todayISO() });
    input.value = '';
    toast('Đã thêm một việc nhỏ vào sổ tay! 🌱');
    await refreshToday();
  } catch (err) { toast(err.message, true); }
  finally { setLoading(button, false); }
});

init();
