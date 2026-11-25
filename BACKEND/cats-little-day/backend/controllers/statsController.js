export function statsController(store) {
  return {
    show(req, res) { res.json({ stats: store.getStats(req.query.date) }); }
  };
}
