import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { literal, Model, Op } from 'sequelize';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import EmailVerificationCode from '../models/EmailVerificationCode.js';
import HasBlocker from '../models/HasBlocker.js';
import MailService from '../services/MailService.js';
import UserService from '../services/UserService.js';
import type {
  User as userType
} from '../types/types.js';
import HasFollower from '../models/HasFollower.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';

class UserController {
  private static userService = new UserService();
  private static mailService = new MailService();

  public static isUsernameAvailable = async (req: Request, res: Response) => {
    const { username } = req.body;
    
    let user;
    try {
      user = await User.findOne({ where: { username }, raw: true }) as userType | null;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server ' });
    }
    
    const isAvailable = user ? false : true;
    return res.status(200).json({ status: 'Ok', isAvailable});
  };

  public static getUser = async (req: Request, res: Response) => {
    let { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;
    if (!username) username = authorizedUser?.username;
    if (!username) return res.status(204);

    let user;
    let isMe;
    try {
      user = await this.userService.getUserDetail(username);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    if (typeof user === 'boolean') return res.status(404).json({ status: 'Error', message: 'User not found' });

    return res.status(200).json({
      status: 'Ok',
      message: 'Successfully fetched user',
      data: {
        ...user,
        isMe
      },
    });
  };

  public static changePassword = async (req: Request, res: Response) => {
    const { current_password, password, password_confirmation, auth } = req.body;
    const { user: authorizedUser } = auth;

    if (password.length < 8) return res.status(400).json({ status: 'Error', message: 'A minimal length of password is 8 characters long!' });
    if (password !== password_confirmation) return res.status(400).json({ status: 'Error', message: 'New password and password confirmation doesn\'t match' });

    try {
      const user = await User.findOne({ where: { id: authorizedUser.id } }) as Model<userType, userType>;
      const comparationResult = await bcrypt.compare(current_password, user.dataValues.password as string);
      if (!comparationResult) return res.status(401).json({ status: 'Error', message: 'Password incorrect' });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.update({ password: hashedPassword }, { where: { id: user.dataValues.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Password changed successfully' });
  };

  public static changeEmail = async (req: Request, res: Response) => {
    const { email, password, auth } = req.body;
    const { user: authorizedUser } = auth;

    try {
      const user = await User.findOne({ where: { id: authorizedUser.id } }) as Model<userType, userType>;
      if (!user) throw new Error();
      const comparationResult = await bcrypt.compare(password, user.dataValues.password);
      if (!comparationResult) return res.status(401).json({ status: 'Password incorrect' });
      const verificationCode = nanoid(6);
      await EmailVerificationCode.update({ deleted_at: new Date().toISOString() }, { where: { user_id: user.dataValues.id } });
      await EmailVerificationCode.create({ user_id: user.dataValues.id, code: verificationCode, expired_at: new Date((+ new Date() + (4 * 60 * 60 * 1000))) });
      await User.update({ email_verified_at: null, email }, { where: { id: user.dataValues.id } });
      await this.mailService.sendEmailVerificationCode({ to: email, username: user.dataValues.username, verificationCode });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Insternal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Email changed successfully, check your email for verification code' });
  };

  public static blockUser = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    if (username === authorizedUser.name) return res.status(400).json({ status: 'Error', message: 'You can\'t block yourself' });
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasBlocker = await HasBlocker.findOne({ where: { blocked_user_id: user.dataValues.id, blocker_user_id: authorizedUser.id } });
      if (hasBlocker) return res.status(400).json({ status: 'Error', message: 'You already blocked this user' });
      await HasBlocker.create({ blocked_user_id: user.dataValues.id, blocker_user_id: authorizedUser.id });
      await HasFollower.destroy({ where: {
        [Op.or]: [
          {
            [Op.and]: [
              { followed_user_id: authorizedUser.id },
              { follower_user_id: user.dataValues.id }
            ]
          },
          {
            [Op.and]: [
              { followed_user_id: user.dataValues.id },
              { follower_user_id: authorizedUser.id }
            ]
          }
        ]
      } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully blocked user' });
  };

  public static unBlockUser = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    if (username === authorizedUser.username) return res.status(400).json({ status: 'Error', message: 'You can\'t unblock yourself' });
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasBlocker = await HasBlocker.findOne({ where: { blocked_user_id: user.dataValues.id, blocker_user_id: authorizedUser.id } });
      if (!hasBlocker) return res.status(400).json({ status: 'Error', message: 'You were not blocked this user' });
      await hasBlocker.destroy();
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully unblocked user' });
  };

  public static getRandomUsers = async (req: Request, res: Response) => {
    const { limit } = req.query;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    let parsedLimit: number | undefined;
    if (limit) {
      parsedLimit = parseInt(limit as string);
      if (Number.isNaN(parsedLimit)) return res.status(400).json({ status: 'Error', message: 'Limit parameter must be a number!' });
    }

    const whereRaw = `id NOT IN (
      SELECT blocked_user_id FROM HasBlockers Hb 
      WHERE Hb.blocker_user_id=${authorizedUser.id} 
      AND Hb.deletedAt IS null
    ) 
    AND id NOT IN (
      SELECT blocker_user_id FROM HasBlockers Hb 
      WHERE Hb.blocked_user_id=${authorizedUser.id} 
      AND Hb.deletedAt IS null
    ) 
    AND id NOT IN (
      ${authorizedUser.id}
    )
    AND id NOT In (
      SELECT followed_user_id FROM HasFollowers Hf 
      WHERE Hf.follower_user_id=${authorizedUser.id}
      AND Hf.deletedAt IS null
    )`;

    let users;
    try {
      users = await User.findAll({ 
        attributes: [ 'id', 'username', 'name', 'createdAt' ],
        where: literal(whereRaw),
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: [ 'bio', 'age', 'location', 'gender', 'url' ],
            include: [
              {
                model: ProfileMedia,
                as: 'profile_media',
                attributes: [ 'file_name', 'file_mime_type', 'context' ]
              }
            ]
          },
          {
            model: User,
            as: 'blocker',
            attributes: [ 'id', 'username', 'name', 'createdAt' ],
          },
          {
            model: User,
            as: 'blocking',
            attributes: [ 'id', 'username', 'name', 'createdAt' ],
          }
        ],
        limit: parsedLimit
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Fetched users successfully', data: users });
  };
}

export default UserController;
