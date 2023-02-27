import express, { json, urlencoded, static as expressStatic } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes/routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import 'dotenv/config';
import Database from './app/core/Database.js';
import Socket from './app/core/Socket.js';
import { associationsInit } from './database/associations.js';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const port = process.env.PORT ?? 3000;

try {
  await Database.authenticate();
  associationsInit();
  Socket.init(io);
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

server.listen(port, () => {
  console.log(`App is listening on port ${port}, http://localhost:${port}`);
});