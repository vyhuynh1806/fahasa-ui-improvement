export function taskController(store) {
  return {
    list(req, res) {
      const tasks = store.getTasks({
        date: req.query.date,
        status: req.query.status ?? 'all',
        search: req.query.search ?? ''
      });
      res.json({ tasks });
    },
    create(req, res) {
      const task = store.createTask(req.body);
      res.status(201).json({ task, message: 'Đã thêm công việc mới!' });
    },
    update(req, res) {
      const task = store.updateTask(req.params.id, req.body);
      res.json({ task, message: 'Đã cập nhật công việc!' });
    },
    remove(req, res) {
      res.json({ ...store.deleteTask(req.params.id), message: 'Đã xóa công việc!' });
    },
    complete(req, res) {
      res.json({ ...store.setCompletion(req.params.id, req.body?.completed), message: 'Đã cập nhật trạng thái công việc!' });
    }
  };
}
