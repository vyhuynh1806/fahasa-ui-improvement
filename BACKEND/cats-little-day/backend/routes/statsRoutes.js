import { Router } from 'express';
import { statsController } from '../controllers/statsController.js';

export function statsRoutes(store) {
  const router = Router();
  const controller = statsController(store);
  router.get('/', controller.show);
  return router;
}
