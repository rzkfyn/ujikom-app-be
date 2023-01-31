import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { Model } from 'sequelize';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import EmailVerificationCode from '../models/EmailVerificationCode.js';
import HasFollower from '../models/HasFollower.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import HasBlocker from '../models/HasBlocker.js';
import MailService from '../services/MailService.js';
import type {
  user as userType,
  profile as profileType,
  profileMedia as profileMediaType,
  hasFollower as hasFollowerType
} from '../types/types.js';


class UserController {
  private static mailService = new MailService();

  public static isUsernameAvailable = async (req: Request, res: Response) => {
    const { username } = req.body;
    
    let user;
    try {
      user = await User.findOne({ where: { username } }) as Model<userType, userType>;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server ' });
    }
    
    const isAvailable = user ? false : true;
    return res.status(200).json({ status: 'Ok', isAvailable});
  };

  public static getUser = async (req: Request, res: Response) => {
    let { username } = req.params;
    const { userData } = req.body;
    if (!username) username = userData.username;

    let user;
    let profile;
    let profileImage;
    let coverImage;
    let followers;
    let following;
    try {
      user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      profile = await Profile.findOne({ where: { user_id: user.dataValues.id } }) as Model<profileType, profileType>;
      profileImage = await ProfileMedia.findOne({ where: { context: 'PROFILE_IMAGE', profile_id: profile.dataValues.id } }) as Model<profileMediaType, profileMediaType>;
      coverImage =  await ProfileMedia.findOne({ where: { context: 'COVER_IMAGE', profile_id: profile.dataValues.id } }) as Model<profileMediaType, profileMediaType>;
      followers = await HasFollower.findAll({ where: {  followed_user_id: user.dataValues.id } }) as unknown;
      following = await HasFollower.findAll({ where: {  follower_user_id: user.dataValues.id } }) as unknown;
      console.log('----------------------------------- here -----------------------');
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    const { email, username: userName } = user.dataValues;
    const { bio } = profile.dataValues;
    const isMe = (email === userData.email) && (userName === userData.username) && (user.dataValues.id === userData.id);
    const userFollowers: {
      username: string | undefined,
      name: string | null | undefined
    }[] = [];
    const userFollowing: {
      username: string | undefined,
      name: string | null | undefined
    }[] = [];

    try {
      for(const followerUser of (followers as Model<hasFollowerType, hasFollowerType>[])) {
        const user = await User.findOne({ where: { id: followerUser.dataValues.follower_user_id } }) as Model<userType, userType>;
        userFollowers.push({
          username: user?.dataValues.username,
          name: user?.dataValues.name
        });
      }

      for(const followingUser of (following as Model<hasFollowerType, hasFollowerType>[])) {
        const user = await User.findOne({ where: { id: followingUser.dataValues.followed_user_id } }) as Model<userType, userType>;
        userFollowing.push({
          username: user.dataValues.username,
          name: user.dataValues.name
        });
      }
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
    
    return res.status(200).json({
      status: 'Ok',
      message: 'User fetched successfully',
      data: {
        user: {
          email,
          userName,
          name: user.dataValues.name,
          created_at: user.dataValues.createdAt,
          updated_at: user.dataValues.updatedAt,
          profile: {
            bio,
            location: profile.dataValues.location,
            profile_image: {
              file_name: profileImage.dataValues.file_name ?? 'default.jpg',
              file_mime_type: profileImage.dataValues.file_mime_type ?? 'image/jpg',
            },
            cover_image: {
              file_name: coverImage.dataValues.file_name ?? 'default.jpg',
              file_mime_type: coverImage.dataValues.file_mime_type ?? 'image/jpg',
            }
          },
          followers: userFollowers,
          following: userFollowing,
          isMe
        }
      }
    });
  };

  public static changePassword = async (req: Request, res: Response) => {
    const { current_password, password, password_confirmation, userData } = req.body;

    if (password.length < 8) return res.status(400).json({ status: 'Error', message: 'A minimal length of password is 8 characters long!' });
    if (password !== password_confirmation) return res.status(400).json({ status: 'Error', message: 'New password and password confirmation doesn\'t match' });

    try {
      const user = await User.findOne({ where: { id: userData.id } }) as Model<userType, userType>;
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
    const { email, password, userData } = req.body;
    try {
      const user = await User.findOne({ where: { id: userData.id } }) as Model<userType, userType>;
      if (!user) throw new Error();
      const comparationResult = await bcrypt.compare(password, user.dataValues.password);
      if (!comparationResult) return res.status(401).json({ status: 'Password incorrect' });
      const verificationCode = nanoid(6);
      await EmailVerificationCode.update({ deleted_at: new Date().toISOString() }, { where: { user_id: user.dataValues.id } });
      await EmailVerificationCode.create({ user_id: user.dataValues.id, code: verificationCode, expired_at: new Date((+ new Date() + (4 * 60 * 60 * 1000))) });
      await User.update({ email_verified_at: null, email }, { where: { id: user.dataValues.id } });
      await this.mailService.sendMail({
        to: email,
        subject: 'Email Verification Code',
        text: `Hello ${user.dataValues.username}!\nuse this code to verify your email: ${verificationCode}`
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Insternal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Email changed successfully, check your email for verification code' });
  };

  public static blockUser = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { userData } = req.body;

    if (username === userData.name) return res.status(400).json({ status: 'Error', message: 'You can\'t block yourself' });
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasBlocker = await HasBlocker.findOne({ where: { bloked_user_id: user.dataValues.id, blocker_user_id: userData.id } });
      if (hasBlocker) return res.status(400).json({ status: 'Error', message: 'You already blocked this user' });
      await HasBlocker.create({ blocked_user_id: user.dataValues.id, blocker_user_id: userData.id });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully blocked user' });
  };

  public static unBlockUser = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { userData } = req.body;

    if (username === userData.username) return res.status(400).json({ status: 'Error', message: 'You can\'t unblock yourself' });
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasBlocker = await HasBlocker.findOne({ where: { blocked_user_id: user.dataValues.id, blocker_user_id: userData.id } });
      if (!hasBlocker) return res.status(400).json({ status: 'Error', message: 'You were not blocked this user' });
      await hasBlocker.destroy();
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully unblocked user' });
  };
}

export default UserController;
