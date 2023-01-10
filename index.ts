import express, { json } from 'express';
import routes from './routes/routes.js';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(json());
app.use(routes);

app.listen(port, () => {
  console.log(`App is listening on port ${port}, http://localhost:${port}`);
});
