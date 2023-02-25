import { Router } from 'express';
import EmailVerificationController from '../../app/controllers/EmailVerificationController.js';
import FollowerController from '../../app/controllers/FollowerController.js';
import PostController from '../../app/controllers/PostController.js';
import ProfileController from '../../app/controllers/ProfileController.js';
import UserController from '../../app/controllers/UserController.js';
import optAuth from '../../app/middlewares/optAuth.js';
import auth from '../../app/middlewares/auth.js';
import ProfileMediaController from '../../app/controllers/ProfileMediaController.js';
import AccountSettingController from '../../app/controllers/AccountSettingController.js';

const router = Router();

router.post('/email/verify', EmailVerificationController.verifyEmail);
router.use(optAuth);
router.get('/connects', UserController.getRandomUsers);
router.get('/:username?', UserController.getUser);
router.post('/username', UserController.isUsernameAvailable);
router.get('/:username/posts', PostController.getUserPosts);
router.get('/:username/followers', FollowerController.getUserFollowersInfo);
router.get('/:username/following', FollowerController.getUserFollowingInfo);
router.use(auth);
router.get('/email/verification-code', EmailVerificationController.requestNewEmailVerificationCode);
router.get('/:username/follow', FollowerController.follow);
router.delete('/:username/follow', FollowerController.removeFollower);
router.get('/:username/unfollow', FollowerController.unfollow);
router.get('/:username/block', UserController.blockUser);
router.get('/:username/unblock', UserController.unBlockUser);
router.put('/profile', ProfileController.updateProfile);
router.put('/profile/profile-image', ProfileMediaController.updateProfileImage);
router.delete('/profile/profile-image', ProfileMediaController.removeProfileImage);
router.put('/profile/cover-image', ProfileMediaController.updateCoverImage);
router.delete('/profile/cover-image', ProfileMediaController.removeProfileImage);
router.put('/account/username', UserController.changeUsername);
router.put('/account/email', UserController.changeEmail);
router.put('/account/password', UserController.changePassword);
router.put('/account/visibility', AccountSettingController.changeAcccontVisibility);

export default router;
