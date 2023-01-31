import { Router } from 'express';
import verifyToken from '../../app/middlewares/verifyToken.js';
import PostController from '../../app/controllers/PostController.js';

const router = Router();

router.use(verifyToken);
router.post('/', PostController.createPost);
router.delete('/:postCode/delete', PostController.deletePost);
// router.put('/:postCode/update', PostController.deletePost);
router.get('/:postCode/like', PostController.likePost);
router.get('/:postCode/unlike', PostController.unLikePost);
router.get('/:postCode/save', PostController.savePost);
router.get('/:postCode/unsave', PostController.unSavePost);

export default router;
