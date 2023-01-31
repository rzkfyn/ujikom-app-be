import { Router } from 'express';
import EmailVerificationController from '../../app/controllers/EmailVerificationController.js';
import FollowerController from '../../app/controllers/FollowerController.js';
import ProfileController from '../../app/controllers/ProfileController.js';
import UserController from '../../app/controllers/UserController.js';
import verifyToken from '../../app/middlewares/verifyToken.js';

const router = Router();

router.use(verifyToken);
router.get('/:username?', UserController.getUser);
router.post('/username', UserController.isUsernameAvailable);
router.get('/:username/follow', FollowerController.follow);
router.get('/:username/unfollow', FollowerController.unfollow);
router.get('/:username/block', UserController.blockUser);
router.get('/:username/unblock', UserController.unBlockUser);
router.post('/email/verify', EmailVerificationController.verifyEmail);
router.get('/email/verification-code', EmailVerificationController.requestNewEmailVerificationCode);
router.put('/profile', ProfileController.updateProfile);
router.put('/profile/profile-image', ProfileController.updateProfile);
router.put('/profile/cover-image', ProfileController.updateCoverImage);
router.put('/account/password', UserController.changePassword);
router.put('/account/email', UserController.changeEmail);

export default router;
