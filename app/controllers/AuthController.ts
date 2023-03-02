import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { Model, Op} from 'sequelize';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import EmailVerificationCode from '../models/EmailVerificationCode.js';
import ResetPasswordVerificationCode from '../models/ResetPasswordVerificationCode.js';
import MailService from '../services/MailService.js';
import type {
  User as userType,
  ResetPasswordVerificationCode as resetPasswordVerificationCodeType
} from '../types/types.js';
import Database from '../core/Database.js';
import AccountSetting from '../models/AccountSetting.js';

class AuthController {
  private static mailService = new MailService();

  public static register = async (req: Request, res: Response) => {
    const { name, username, email, password, password_confirmation, date_of_birth, gender }: {
      name: string, username: string, email: string, password: string, password_confirmation: string, date_of_birth: string, gender: 'MALE' | 'FEMALE' | undefined
    } = req.body;
    const requiredRequestBody = { name, username, email, password, password_confirmation, date_of_birth };
    const emptyDataIndex = Object.values(requiredRequestBody).findIndex((val) => !val);

    if (emptyDataIndex !== -1) return res.status(400).json({ status: 'Error', message: `field ${Object.keys(requiredRequestBody)[emptyDataIndex]} is required!` });
    if (password.length < 8) return res.status(400).json({ status: 'Error', message: 'Password too short! Password must have a minimal 8 characters long' });
    if (password !== password_confirmation) return res.status(400).json({ status: 'Error', message: 'Password doesn\'t match' });

    let access_token;
    let refresh_token;
    let newUser;
    let verificationCode;
    const transaction = await Database.transaction();
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

      newUser = await User.create({ name, username, email, password: hashedPassword }, { transaction }) as Model<userType, userType>;
      await AccountSetting.create({ user_id: newUser.dataValues.id, account_visibility: 'PUBLIC' }, { transaction });
      const age = new Date().getFullYear() - new Date(date_of_birth).getFullYear();
      const newProfile = await Profile.create({
        user_id: newUser.dataValues.id, date_of_birth: new Date(date_of_birth).toISOString(), age, gender: gender ?? null 
      }, { transaction });
      await ProfileMedia.create({ profile_id: newProfile.dataValues.id, context: 'PROFILE_IMAGE' }, { transaction });
      await ProfileMedia.create({ profile_id: newProfile.dataValues.id, context: 'COVER_IMAGE' }, { transaction });

      refresh_token = jwt.sign({ id: newUser.dataValues.id, email, username }, process.env.SECRET_JWT_REFRESH_TOKEN as string, { expiresIn: '24h' });
      access_token = jwt.sign({ id: newUser.dataValues.id, name, email, username }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: '30s' });
      await User.update({ refresh_token }, { where: { id: newUser.dataValues.id }, transaction });

      verificationCode = nanoid(6);
      await EmailVerificationCode.create({ 
        code: verificationCode, user_id: newUser.dataValues.id, expired_at: new Date((+ new Date()) + (4 * 60 * 60 * 1000)).toISOString()
      }, { transaction });

      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    res.cookie('refresh_token', refresh_token, { maxAge: 24 * 60 * 60 * 1000, secure: false, httpOnly: true });
    res.status(201).json({
      status: 'Ok',
      message: 'Successfully registered new account',
      data: {
        user: {
          id: newUser.dataValues.id,
          username: newUser.dataValues.username,
          email: newUser.dataValues.email
        },
        access_token
      }
    });

    try {
      await this.mailService.sendEmailVerificationCode({ to: email, username, verificationCode });
    } catch(e) {
      console.log(e);
    }
  };

  public static login = async (req: Request, res: Response) => {
    const { uid, password } = req.body;
    const { fromMobile } = req.query;

    let user;
    try {
      user = await User.findOne({ where: {
        [Op.or]: [
          { username: uid },
          { email: uid }
        ] 
      }}) as Model<userType, userType>;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
    if (!user) return res.status(401).json({ status: 'Error', message: 'The credential doesn\'t match with any of our records' });

    let refresh_token;
    let access_token;
    try {
      const comparationResult = await bcrypt.compare(password, user.dataValues.password);
      if (!comparationResult) return res.status(401).json({ status: 'Error', message: 'The credential doesn\'t match with any of our records' });

      refresh_token = jwt.sign({ id: user.dataValues.id, email: user.dataValues.email, username: user.dataValues.username }, process.env.SECRET_JWT_REFRESH_TOKEN as string, { expiresIn: '24h' });
      access_token = jwt.sign({ id: user.dataValues.id, email: user.dataValues.email, username: user.dataValues.username }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: fromMobile ? '30s' : '1d' });

      await User.update({ refresh_token }, { where: { id: user.dataValues.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    res.cookie('refresh_token', refresh_token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false
    });
    return res.status(200).json({ status: 'Ok', message: 'Login success', data: {
      user: {
        id: user.dataValues.id,
        name: user.dataValues.name,
        username: user.dataValues.username
      },
      access_token
    }});
  };

  public static logout = async (req: Request, res: Response) => {
    const { refresh_token } = req.cookies;

    const transaction = await Database.transaction();
    try {
      if (refresh_token) {
        const user = await User.findOne({ where: { refresh_token } }) as Model<userType, userType>;
        if (user) {
          await User.update({ refresh_token: null }, { where: { id: user.dataValues.id }, transaction });
        }
      }

      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
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
      user = await User.findOne({ where: { refresh_token } }) as Model<userType, userType>;
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

    if (!((decoded.id === user.dataValues.id) && (decoded.email === user.dataValues.email))) return res.status(401).json({
      status: 'Error', message: 'Refresh token is invalid'
    });
    const access_token = jwt.sign({ id: user.dataValues.id, username: user.dataValues.username, email: user.dataValues.email }, process.env.SECRET_JWT_ACCESS_TOKEN as string, { expiresIn: '15s' });

    return res.status(200).json({ status: 'Ok', message: 'Access token refreshed', data: { access_token } });
  };

  public static requestResetPasswordVerificationCode = async (req: Request, res: Response) => {
    const { uid } = req.body;

    let user;
    try {
      user = await User.findOne({ where: {
        [Op.or]: [
          { username: uid },
          { email: uid }
        ]
      }}) as Model<userType, userType>;
      if (!user) return res.status(400).json({ status: 'Error', message: 'There\'s no account with the given username or email' });

      const verificationCode = nanoid(6);
      await ResetPasswordVerificationCode.destroy({ where: { user_id: user.dataValues.id } });
      await ResetPasswordVerificationCode.create({ code: verificationCode, user_id: user.dataValues.id, expired_at: new Date(+ new Date() + (4 * 60 * 60 * 1000)).toISOString() });
      await this.mailService.sendMail({
        to: user.dataValues.email,
        subject: 'Reset Password Verification Code',
        text: `Hi ${user.dataValues.username}!\nsomeone (hopefully you) was requesting to reset your account's password.\nUse this code to change your password: ${verificationCode}`
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Success, reset password verification code has been sent', data: { email_sent_to: user.dataValues.email } });
  };

  public static resetPassword = async (req: Request, res: Response) => {
    const { verification_code, password } = req.body;
    const requestBody = { verification_code, password };
    const emptyDataIndex = Object.values(requestBody).findIndex((val) => !val);

    if (emptyDataIndex !== -1) return res.status(400).json({ status: 'Error', message: `field ${Object.keys(requestBody)[emptyDataIndex]} is required!` });
    if (password.length < 8) return res.status(400).json({ status: 'Error', message: 'Password too short! Password must have a minimal 8 characters long' });

    try {
      const resetPasswordCode = await ResetPasswordVerificationCode.findOne({ where: { code: verification_code } }) as Model<resetPasswordVerificationCodeType, resetPasswordVerificationCodeType>;
      if (!resetPasswordCode) return res.status(400).json({ status: 'Error', message: 'Reset password code is invalid' });
      if (new Date(resetPasswordCode.dataValues.expired_at).toISOString() <= new Date().toISOString()) return res.status(400).json({ status: 'Error', message: 'The given reset password code is already expired' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.update({ password: hashedPassword }, { where: { id: resetPasswordCode.dataValues.user_id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Password changed successfully' });
  };
}

export default AuthController;
