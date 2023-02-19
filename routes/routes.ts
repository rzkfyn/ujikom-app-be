import { Router } from 'express';
import auth from './utils/auth.js';
import user from './utils/user.js';
import post from './utils/post.js';
import notification from './utils/notification.js';

const routes = Router();

routes.all('/', (_, res) => res.status(200).json({ status: 'Ok', message: 'Hello, World!' }));

routes.use('/v1/auth', auth);
routes.use('/v1/users', user);
routes.use('/v1/posts', post);
routes.use('/v1/notifications', notification);

routes.use((_, res) => res.status(404).json({ status: 'Error', message: 'Not found' }));

export default routes;
