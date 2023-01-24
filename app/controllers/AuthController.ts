import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { QueryTypes } from 'sequelize';
import User from '../models/User.js';
import MailService from '../services/MailService.js';
import EmailVerificationCode from '../models/EmailVerificationCode.js';
import Database from '../core/Database.js';
import type {
  user as userType
} from '../types/types.js';
import ResetPasswordVerificationCode from '../models/ResetPasswordVerificationCode.js';

class AuthController {
  private static mailService = new MailService();

  public static register = async (req: Request, res: Response) => {
    const { name, username, email, password, password_confirmation }: {
      name: string, username: string, email: string, password: string, password_confirmation: string
    } = req.body;
    const requestBody = { name, username, email, password, password_confirmation };
    const emptyDataIndex = Object.values(requestBody).findIndex((val) => !val);

    if (emptyDataIndex !== -1) return res.status(400).json({ status: 'Error', message: `field ${Object.keys(requestBody)[emptyDataIndex]} is required!` });
    if (password.length < 8) return res.status(400).json({ status: 'Error', message: 'Password too short! Password must have a minimal 8 characters long' });
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
      if (dataAlreadyExistsOnField) return res.status(400).json({
        status: 'Error', message: `${dataAlreadyExistsOnField} already used`
      });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = await User.create({ name, username, email, password: hashedPassword });
      refresh_token = jwt.sign({ id: newUser.dataValues.id, email, username }, process.env.SECRET_JWT_REFRESH_TOKEN as string, { expiresIn: '24h' });
      access_token = jwt.sign({ id: newUser.dataValues.id, name, email, username }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: '30s' });
      await User.update({ refresh_token }, { where: { id: newUser.dataValues.id } });

      const verificationCode = nanoid(6);
      await EmailVerificationCode.create({ 
        code: verificationCode, user_id: newUser.dataValues.id, expired_at: new Date((+ new Date()) + (4 * 60 * 60 * 1000)).toISOString()
      });
      await this.mailService.sendMail({
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

  public static login = async (req: Request, res: Response) => {
    const { uid, password } = req.body;

    let user;
    try {
      user = await Database.query(`SELECT * FROM users WHERE username='${uid}' or email='${uid}' LIMIT 1`, {
        type: QueryTypes.SELECT
      }) as userType[] | null; 
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
    if (!user || !user[0]) return res.status(401).json({ status: 'Error', message: 'The credential doesn\'t match with any of our records' });
    user = user[0] as userType;

    let refresh_token;
    let access_token;
    try {
      const comparationResult = await bcrypt.compare(password, user.password);
      if (!comparationResult) return res.status(401).json({ status: 'Error', message: 'The credential doesn\'t match with any of our records' });

      refresh_token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.SECRET_JWT_REFRESH_TOKEN as string, { expiresIn: '24h' });
      access_token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: '30s' });

      await User.update({ refresh_token }, { where: { id: user.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    res.cookie('refresh_token', refresh_token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true
    });
    return res.status(200).json({ status: 'Ok', message: 'Login success', data: { access_token } });
  };

  public static logout = async (req: Request, res: Response) => {
    const { refresh_token } = req.cookies;

    try {
      if (refresh_token) {
        const user = await User.findOne({ where: { refresh_token } }) as userType | null;
        if (user) {
          await User.update({ refresh_token: null }, { where: { id: user.id } });
        }
      }
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    res.clearCookie('refresh_token');
    return res.status(200).json({ status: 'Ok', message: 'Logout success' });
  };

  public static refreshAccessToken = async (req: Request, res: Response) => {
    const { refresh_token } = req.cookies;
    if (!refresh_token) return res.status(400).json({ status: 'Error', message: 'Refresh token doesnt\'t exist' });
    
    let user;
    try {
      user = await User.findOne({ where: { refresh_token } }) as userType | null;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
    if (!user) return res.status(401).json({ status: 'Error', message: 'Refresh token is invalid' });

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.SECRET_JWT_REFRESH_TOKEN as string) as { id: number, username: string, email: string };
    } catch(_) {
      return res.status(401).json({ status: 'Error', message: 'Refresh token is invalid or already expired' });
    }

    if (!((decoded.id === user.id) && (decoded.email === user.email) && (decoded.username === user.username))) return res.status(401).json({
      status: 'Error', message: 'Refresh token is invalid'
    });
    const access_token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: '30s' });

    return res.status(200).json({ status: 'Ok', message: 'Access token refreshed', data: { access_token } });
  };

  public static requestResetPasswordVerificationCode = async (req: Request, res: Response) => {
    const { uid } = req.body;

    let user: userType[] | userType;
    try {
      user = await Database.query(`SELECT * FROM users WHERE username='${uid}' OR email='${uid}' LIMIT 1`, {
        type: QueryTypes.SELECT,
      }) as userType[];
      user = user[0];
      if (!user) return res.status(400).json({ status: 'Error', message: 'There\'s no account with the given username or email' });

      const verificationCode = nanoid(6);
      await ResetPasswordVerificationCode.create({ code: verificationCode, user_id: user.id, expired_at: new Date(+ new Date() + (4 * 60 * 60 * 1000)).toISOString() });
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Reset Password Verification Code',
        text: `Hi ${user.username}!\nsomeone (hopefully you) was requesting to reset your account's password.\nUse this code to change your password: ${verificationCode}`
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Success, reset password verification code has been sent', data: { email_sent_to: user.email } });
  };
}

export default AuthController;
