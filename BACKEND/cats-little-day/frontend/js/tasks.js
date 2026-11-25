import { api } from './api.js';
import { initializeLayout, todayISO, prettyDate, escapeHTML, toast, updateCoins, setLoading } from './shared.js';

initializeLayout();
const $ = (selector) => document.querySelector(selector);
const state = { scope: 'today', status: 'all', search: '', tasks: [], editingId: null, requestNumber: 0 };
const dialog = $('#taskDialog');

function renderList() {
  const list = $('#taskList');
  const tasks = state.tasks;
  $('#taskCountLabel').textContent = `${tasks.length} công việc`;
  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-image">🐱</span><strong>Chưa có công việc nào ở đây!</strong><p>Thêm một điều xinh xắn để Miu có cơ hội nhận xu nhé.</p></div>`;
    return;
  }
  list.innerHTML = tasks.map((task) => `
    <article class="task-card ${task.status ? 'is-done' : ''}">
      <input class="task-check" type="checkbox" data-complete="${task.id}" ${task.status ? 'checked' : ''} aria-label="Hoàn thành ${escapeHTML(task.title)}">
      <div class="task-main">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
        <div class="task-meta"><span class="date-tag">📅 ${prettyDate(task.task_date)}</span><span class="${task.status ? 'done-tag' : 'pending-tag'}">${task.status ? '✓ Đã hoàn thành' : '◷ Chưa hoàn thành'}</span></div>
      </div>
      <div class="task-controls"><button type="button" class="icon-button" data-edit="${task.id}" title="Sửa công việc" aria-label="Sửa ${escapeHTML(task.title)}">✎</button><button type="button" class="icon-button danger" data-delete="${task.id}" title="Xóa công việc" aria-label="Xóa ${escapeHTML(task.title)}">✕</button></div>
    </article>`).join('');
}

async function refreshProgress() {
  const { stats } = await api.stats(todayISO());
  const { total, completed, rate } = stats.today;
  $('#taskProgressPercent').textContent = `${rate}%`;
  $('#taskProgressBar').style.width = `${rate}%`;
  $('#taskProgressCount').textContent = `${completed}/${total} công việc`;
  $('#progressMessage').textContent = total === 0 ? 'Hôm nay chưa có việc nào, thử lập kế hoạch nhé!' :
    rate === 100 ? 'Tuyệt vời! Miu đang rất tự hào về bạn 🌷' : `Bạn đã hoàn thành ${completed} trên ${total} việc hôm nay!`;
  updateCoins(stats.coins);
}

async function loadTasks() {
  const requestNumber = ++state.requestNumber;
  const filters = { status: state.status, search: state.search };
  if (state.scope === 'today') filters.date = todayISO();
  try {
    const { tasks } = await api.tasks(filters);
    if (requestNumber !== state.requestNumber) return;
    state.tasks = tasks;
    renderList();
  } catch (error) {
    if (requestNumber === state.requestNumber) {
      $('#taskList').innerHTML = '<div class="empty-state"><span class="empty-image">😿</span><strong>Không tải được công việc.</strong><p>Hãy kiểm tra máy chủ rồi tải lại.</p></div>';
      toast(error.message, true);
    }
  }
}

function openTaskForm(task = null) {
  state.editingId = task?.id ?? null;
  $('#dialogTitle').textContent = task ? 'Sửa công việc ✎' : 'Thêm công việc mới ♡';
  $('#taskTitle').value = task?.title ?? '';
  $('#taskDescription').value = task?.description ?? '';
  $('#taskDate').value = task?.task_date ?? todayISO();
  dialog.showModal();
  $('#taskTitle').focus();
}

$('#addTaskButton').addEventListener('click', () => openTaskForm());
$('#closeDialog').addEventListener('click', () => dialog.close());
$('#cancelDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

$('#taskForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = $('#taskTitle').value.trim();
  const description = $('#taskDescription').value.trim();
  const task_date = $('#taskDate').value;
  if (!title) return toast('Hãy nhập tên công việc nhé!', true);
  if (!task_date) return toast('Hãy chọn ngày thực hiện nhé!', true);
  const save = $('#saveTask');
  setLoading(save, true);
  try {
    const payload = { title, description, task_date };
    if (state.editingId) await api.editTask(state.editingId, payload);
    else await api.addTask(payload);
    dialog.close();
    toast(state.editingId ? 'Đã lưu thay đổi của bạn! 📝' : 'Đã thêm công việc mới! 🌼');
    await Promise.all([loadTasks(), refreshProgress()]);
  } catch (error) { toast(error.message, true); }
  finally { setLoading(save, false); }
});

$('#taskList').addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) {
    const task = state.tasks.find((t) => t.id === Number(editButton.dataset.edit));
    if (task) openTaskForm(task);
  }
  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);
    const task = state.tasks.find((t) => t.id === id);
    if (!task || !confirm(`Bạn muốn xóa công việc “${task.title}”?${task.status ? '\n(Lưu ý: sẽ thu hồi 10 xu đã thưởng.)' : ''}`)) return;
    deleteButton.disabled = true;
    try {
      const response = await api.removeTask(id);
      updateCoins(response.cat.coins);
      toast('Đã xóa công việc khỏi sổ tay! 🧹');
      await Promise.all([loadTasks(), refreshProgress()]);
    } catch (error) { toast(error.message, true); deleteButton.disabled = false; }
  }
});

$('#taskList').addEventListener('change', async (event) => {
  const check = event.target.closest('[data-complete]');
  if (!check) return;
  check.disabled = true;
  try {
    const response = await api.completeTask(check.dataset.complete, check.checked);
    updateCoins(response.cat.coins);
    toast(response.earned === 10 ? 'Yay! +10 xu cho Miu! 🪙' : 'Đã cập nhật công việc và số xu.');
    await Promise.all([loadTasks(), refreshProgress()]);
  } catch (error) { check.checked = !check.checked; check.disabled = false; toast(error.message, true); }
});

document.querySelectorAll('[data-scope]').forEach((button) => button.addEventListener('click', () => {
  state.scope = button.dataset.scope;
  document.querySelectorAll('[data-scope]').forEach((other) => {
    other.classList.toggle('is-selected', other === button);
    other.setAttribute('aria-pressed', String(other === button));
  });
  loadTasks();
}));

let searchTimer;
$('#searchInput').addEventListener('input', (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.search = event.target.value.trim(); loadTasks(); }, 250);
});
$('#statusFilter').addEventListener('change', (event) => { state.status = event.target.value; loadTasks(); });

loadTasks();
refreshProgress().catch((error) => toast(error.message, true));
