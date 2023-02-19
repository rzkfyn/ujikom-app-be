import { Router } from 'express';
import PostController from '../../app/controllers/PostController.js';
import auth from '../../app/middlewares/auth.js';
import optAuth from '../../app/middlewares/optAuth.js';

const router = Router();

router.use(optAuth);
router.get('/', PostController.getRandomPost);
router.get('/saved', auth, PostController.getSavedPosts);
router.get('/:postCode', PostController.getPostByPostCode);
router.use(auth);
router.post('/', PostController.createPost);
router.delete('/:postCode/delete', PostController.deletePost);
router.get('/:postCode/like', PostController.likePost);
router.get('/:postCode/unlike', PostController.unLikePost);
router.get('/:postCode/save', PostController.savePost);
router.delete('/:postCode/save', PostController.unSavePost);

export default router;
