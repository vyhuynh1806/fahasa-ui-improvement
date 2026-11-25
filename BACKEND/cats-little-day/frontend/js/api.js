const BASE = '/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
  } catch {
    throw new Error('Không kết nối được với máy chủ. Hãy kiểm tra npm run dev nhé!');
  }
  let data;
  try { data = await response.json(); } catch { throw new Error('Máy chủ trả về dữ liệu không hợp lệ.'); }
  if (!response.ok) throw new Error(data.error || `Lỗi HTTP ${response.status}`);
  return data;
}

export const api = {
  tasks: (filters = {}) => request(`/tasks?${new URLSearchParams(filters)}`),
  addTask: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  editTask: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  removeTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  completeTask: (id, completed) => request(`/tasks/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  stats: (date) => request(`/stats?${new URLSearchParams({ date })}`),
  cat: () => request('/cat'),
  feedCat: () => request('/cat/feed', { method: 'POST' }),
  petCat: () => request('/cat/pet', { method: 'POST' }),
  napCat: () => request('/cat/nap', { method: 'POST' })
};
