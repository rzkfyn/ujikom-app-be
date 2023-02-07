import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const optAuth = (req: Request, _: Response, next: NextFunction) => {
  const authorizationHeader = req.header('Authorization');
  if (!authorizationHeader) return next();
  const access_token = authorizationHeader.split(' ')[1];
  if (!access_token) return next();

  let decoded;
  try {
    decoded = jwt.verify(access_token, process.env.SECRET_JWT_ACCESS_TOKEN as string) as { id: number, email: string, username: string };
  } catch(e) { 
    console.log(e);
  }
  
  req.body.auth = decoded ?  {
    user: decoded
  } : {};
  next();
};

export default optAuth;
