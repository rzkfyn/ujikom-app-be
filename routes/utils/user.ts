import { Router } from 'express';
import UserController from '../../app/controllers/UserController.js';
import verifyToken from '../../app/middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);
router.post('/email/verify', UserController.verifyEmail);
router.get('/email/verification-code', UserController.requestNewEmailVerificationCode);
router.get('/:username?', UserController.getUser);
router.put('/profile-image', UserController.updateProfileImage);

export default router;
