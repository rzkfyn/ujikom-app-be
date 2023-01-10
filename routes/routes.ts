import { Router } from 'express';

const routes = Router();

routes.all('/', (_, res) => res.status(200).json({ status: 'Ok', message: 'Hello, World!' }));

export default routes;
