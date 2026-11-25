export function catController(store) {
  return {
    show(_req, res) { res.json({ cat: store.getCat() }); },
    feed(_req, res) { res.json({ cat: store.feedCat(), message: 'Mèo đã ăn no và rất vui!' }); },
    pet(_req, res) { res.json({ cat: store.petCat(), message: 'Meo meo! Mèo thích được vuốt ve.' }); },
    nap(_req, res) { res.json({ cat: store.napCat(), message: 'Đã thay đổi trạng thái ngủ của mèo.' }); }
  };
}
