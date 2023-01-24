import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import User from '../models/User.js';
import MailService from '../services/MailService.js';
import EmailVerificationCode from '../models/EmailVerificationCode.js';

class AuthController {
  private static mailService = new MailService();

  public static register = async (req: Request, res: Response) => {
    const { name, username, email, password, password_confirmation }: {
      name: string, username: string, email: string, password: string, password_confirmation: string
    } = req.body;
    const requestBody = { name, username, email, password, password_confirmation };
    const emptyDataIndex = Object.values(requestBody).findIndex((val) => !val);

    if (emptyDataIndex !== -1) return res.status(400).json({ status: 'Error', message: `field ${Object.keys(requestBody)[emptyDataIndex]} is required!` });
    if (password !== password_confirmation) return res.status(400).json({ status: 'Error', message: 'Password doesn\'t match' });

    let access_token;
    let refresh_token;
    try {
      let dataAlreadyExistsOnField = null;
      let user = await User.findOne({ where: { username } });

      if (user) {
        dataAlreadyExistsOnField = 'Username';
      } else {
        user = await User.findOne({ where: { email } });
        if (user) dataAlreadyExistsOnField = 'Email';
      }
      console.log(dataAlreadyExistsOnField);
      if (dataAlreadyExistsOnField) return res.status(400).json({
        status: 'Error', message: `${dataAlreadyExistsOnField} already used`
      });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      refresh_token = jwt.sign({ name, email, username }, process.env.SECRET_JWT_REFRESH_TOKEN as string, { expiresIn: '24h' });
      access_token = jwt.sign({ name, email, username }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: '30s' });
      const newUser = await User.create({ name, username, email, password: hashedPassword, refresh_token });
      const verificationCode = nanoid(6);

      await EmailVerificationCode.create({ 
        code: verificationCode, user_id: newUser.dataValues.id, expired_at: new Date((+ new Date()) + (4 * 60 * 60 * 1000)).toISOString()
      });
      await AuthController.mailService.sendMail({
        to: email,
        subject: 'Email Verification Code',
        text: `Hello ${username}!\nuse this code to verify your email: ${verificationCode}`
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    res.cookie('refresh_token', refresh_token, { maxAge: 24 * 60 * 60 * 1000, secure: false, httpOnly: true });
    return res.status(201).json({ status: 'Ok', message: 'Successfully registered new account', data: { access_token } });
  };
}

export default AuthController;
