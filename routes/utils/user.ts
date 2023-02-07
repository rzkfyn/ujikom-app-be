import { Router } from 'express';
import EmailVerificationController from '../../app/controllers/EmailVerificationController.js';
import FollowerController from '../../app/controllers/FollowerController.js';
import PostController from '../../app/controllers/PostController.js';
import ProfileController from '../../app/controllers/ProfileController.js';
import UserController from '../../app/controllers/UserController.js';
import optAuth from '../../app/middlewares/optAuth.js';
import auth from '../../app/middlewares/auth.js';

const router = Router();

router.use(optAuth);
router.get('/:username?', UserController.getUser);
router.post('/username', UserController.isUsernameAvailable);
router.get('/:username/posts', PostController.getUserPosts);
router.get('/:username/followers', FollowerController.getUserFollowersInfo);
router.get('/:username/following', FollowerController.getUserFollowingInfo);
router.use(auth);
router.get('/:username/follow', FollowerController.follow);
router.delete('/:username/follow', FollowerController.removeFollower);
router.get('/:username/unfollow', FollowerController.unfollow);
router.get('/:username/block', UserController.blockUser);
router.get('/:username/unblock', UserController.unBlockUser);
router.post('/email/verify', EmailVerificationController.verifyEmail);
router.get('/email/verification-code', EmailVerificationController.requestNewEmailVerificationCode);
router.put('/profile', ProfileController.updateProfile);
router.put('/profile/profile-image', ProfileController.updateProfileImage);
router.put('/profile/cover-image', ProfileController.updateCoverImage);
router.put('/account/password', UserController.changePassword);
router.put('/account/email', UserController.changeEmail);

export default router;
