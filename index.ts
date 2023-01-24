import express, { json, urlencoded } from 'express';
import routes from './routes/routes.js';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import Database from './app/core/Database.js';

const app = express();
const port = process.env.PORT ?? 3000;

try {
  await Database.sync();
} catch(e) {
  console.log(e);
}

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(routes);

app.listen(port, () => {
  console.log(`App is listening on port ${port}, http://localhost:${port}`);
});
