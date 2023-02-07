import { Router } from 'express';
import PostController from '../../app/controllers/PostController.js';
import auth from '../../app/middlewares/auth.js';

const router = Router();

router.use(auth);
router.post('/', PostController.createPost);
router.delete('/:postCode/delete', PostController.deletePost);
router.get('/:postCode/like', PostController.likePost);
router.get('/:postCode/unlike', PostController.unLikePost);
router.get('/:postCode/save', PostController.savePost);
router.get('/:postCode/unsave', PostController.unSavePost);

export default router;
