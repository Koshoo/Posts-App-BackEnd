import express from 'express';
import {
  getPosts,
  createPost,
  likePost,
  deletePost,
  updatePost
} from '../controllers/posts.js';
const router = express.Router();

router.get('/', getPosts);
router.post('/', createPost);
router.put('/:id/likePost', likePost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
