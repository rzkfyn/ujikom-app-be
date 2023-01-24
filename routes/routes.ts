import { Router } from 'express';
import auth from './utils/auth.js';
import user from './utils/user.js';

const routes = Router();

routes.all('/', (_, res) => res.status(200).json({ status: 'Ok', message: 'Hello, World!' }));

routes.use('/v1/auth', auth);
routes.use('/v1/user', user);

export default routes;
