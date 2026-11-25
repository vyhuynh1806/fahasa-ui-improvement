import { Router } from 'express';
import { catController } from '../controllers/catController.js';

export function catRoutes(store) {
  const router = Router();
  const controller = catController(store);
  router.get('/', controller.show);
  router.post('/feed', controller.feed);
  router.post('/pet', controller.pet);
  router.post('/nap', controller.nap);
  return router;
}
