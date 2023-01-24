import { Router } from 'express';
import AuthController from '../../app/controllers/AuthController.js';

const auth = Router();

auth.post('/register', AuthController.register);
auth.post('/login', AuthController.login);
auth.post('/logout', AuthController.logout);

export default auth;
