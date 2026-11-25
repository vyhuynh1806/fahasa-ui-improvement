import { api } from './api.js';

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function prettyDate(date) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}

export function fullDate(date = todayISO()) {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function toast(message, error = false) {
  const node = document.createElement('div');
  node.className = `toast ${error ? 'toast--error' : ''}`;
  node.textContent = message;
  node.setAttribute('role', error ? 'alert' : 'status');
  document.querySelector('#toastStack')?.append(node);
  setTimeout(() => { node.classList.add('toast--exit'); setTimeout(() => node.remove(), 280); }, 3400);
}

export function setLoading(button, loading, label = 'Đang xử lý...') {
  if (!button) return;
  if (loading) { button.dataset.original = button.innerHTML; button.disabled = true; button.textContent = label; }
  else { button.disabled = false; if (button.dataset.original) button.innerHTML = button.dataset.original; }
}

export function updateCoins(coins) {
  document.querySelectorAll('[data-coins]').forEach((node) => { node.textContent = coins; });
}

export async function refreshHeader() {
  try { updateCoins((await api.cat()).cat.coins); } catch { /* pages show dedicated error on load */ }
}

export function initializeLayout() {
  document.querySelectorAll('[data-today-date]').forEach((el) => { el.textContent = fullDate(); });
  document.querySelector('#mobileMenuToggle')?.addEventListener('click', () => {
    const nav = document.querySelector('#siteNav');
    const expanded = nav.classList.toggle('is-open');
    document.querySelector('#mobileMenuToggle')?.setAttribute('aria-expanded', String(expanded));
  });
  refreshHeader();
}
