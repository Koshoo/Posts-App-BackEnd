import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createUser,
  login,
  deleteUser,
  tokenIsValid,
  getUpdatedUser
} from '../controllers/users.js';

const router = express.Router();

router.post('/register', createUser);
router.post('/login', login);
router.delete('/delete', auth, deleteUser);
router.post('/tokenIsValid', tokenIsValid);
router.get('/getUser', getUpdatedUser);

export default router;
