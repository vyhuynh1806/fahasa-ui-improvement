import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';

export function taskRoutes(store) {
  const router = Router();
  const controller = taskController(store);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  router.patch('/:id/complete', controller.complete);
  return router;
}
