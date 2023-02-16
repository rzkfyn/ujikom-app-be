import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const auth = (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.header('Authorization');
  if (!authorizationHeader) return res.status(401).json({ status: 'Error', message: 'Authorization header not exists' });
  const access_token = authorizationHeader.split(' ')[1];
  if (!access_token) return res.status(401).json({ status: 'Error', message: 'Access token not exists' });

  let decoded;
  try {
    decoded = jwt.verify(access_token, process.env.SECRET_JWT_ACCESS_TOKEN as string) as { id: number, email: string, username: string };
  } catch(e) {
    console.log(e);
    return res.status(401).json({ status: 'Error', message: 'Access token is invalid or already expired' });
  }
  
  req.body.auth = { user: decoded };
  next();
};

export default auth;
