import express, { json, urlencoded, static as expressStatic } from 'express';
import routes from './routes/routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import 'dotenv/config';
import Database from './app/core/Database.js';
import { associationsInit } from './database/commands/associations.js';

const app = express();
const port = process.env.PORT ?? 3000;

try {
  await Database.authenticate();
  associationsInit();
} catch(e) {
  console.log(e);
}

app.use(cors({ origin: ['http://127.0.0.1:5173', 'http://localhost:5173' ], credentials: true }));
app.use(json());
app.use(expressStatic('public'));
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());
app.use(routes);

app.listen(port, () => {
  console.log(`App is listening on port ${port}, http://localhost:${port}`);
});
