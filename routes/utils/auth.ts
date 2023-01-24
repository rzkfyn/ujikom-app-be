import { Router } from 'express';
import AuthController from '../../app/controllers/AuthController.js';

const auth = Router();

auth.post('/register', AuthController.register);

export default auth;
