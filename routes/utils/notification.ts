import { Router } from 'express';
import NotificationController from '../../app/controllers/NotificationController.js';
import auth from '../../app/middlewares/auth.js';

const router = Router();

router.use(auth);
router.get('/', NotificationController.getNotifications);
router.get('/seen', NotificationController.setNotificationsAsSeen);

export default router;
