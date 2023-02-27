import { Router } from 'express';
import CommentController from '../../app/controllers/CommentController.js';
import PostController from '../../app/controllers/PostController.js';
import auth from '../../app/middlewares/auth.js';
import optAuth from '../../app/middlewares/optAuth.js';

const router = Router();

router.use(optAuth);
router.get('/', PostController.getRandomPost);
router.get('/saved', auth, PostController.getSavedPosts);
router.get('/:postCode', PostController.getPostByPostCode);
router.get('/:postCode/comments', CommentController.getPostComments);
router.use(auth);
router.post('/', PostController.createPost);
router.delete('/:postCode/delete', PostController.deletePost);
router.get('/:postCode/like', PostController.likePost);
router.get('/:postCode/unlike', PostController.unLikePost);
router.post('/:postCode/share', PostController.sharePost);
router.post('/:postCode/comments', CommentController.sendComment);
router.get('/:postCode/save', PostController.savePost);
router.delete('/:postCode/save', PostController.unSavePost);
router.get('/by-id/:postId', PostController.getPostById);

export default router;
