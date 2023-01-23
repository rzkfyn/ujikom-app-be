import { Router } from 'express';
import auth from './utils/auth.js';

const routes = Router();

routes.all('/', (_, res) => res.status(200).json({ status: 'Ok', message: 'Hello, World!' }));

routes.use('/v1/auth', auth);

export default routes;
