import { Router } from 'express';
import UserController from '../../app/controllers/UserController.js';
import verifyToken from '../../app/middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);
router.post('/verify-email', UserController.verifyEmail);

export default router;
