import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import EmailVerificationCode from '../models/EmailVerificationCode.js';
import HasFollower from '../models/HasFollower.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import User from '../models/User.js';
import MailService from '../services/MailService.js';
import type {
  user as userType,
  emailVerificationCode as emailVerificationCodeType,
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
      user = await User.findOne({ where: { username } }) as userType | null;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server ' });
    }
    
    const isAvailable = user ? false : true;
    return res.status(200).json({ status: 'Ok', isAvailable});
  };

  public static verifyEmail = async (req: Request, res: Response) => {
    const { verification_code } = req.body;
    const { id, username, email } = req.body.userData;

    try {
      const user = await User.findOne({ where: { id, username, email } }) as userType | null;
      const emailVerificationCode = await EmailVerificationCode.findOne({ where: { code: verification_code, user_id: user?.id, deleted_at: null } }) as emailVerificationCodeType | null;

      if (user?.email_verified_at !== null) return res.status(400).json({ status: 'Error', message: 'This user\'s email is already verified' });
      if (!emailVerificationCode) return res.status(400).json({
        status: 'Error', message: 'The given verification code is invalid'
      });
      if (new Date(emailVerificationCode.expired_at).toISOString() <= new Date().toISOString()) return res.status(400).json({
        status: 'Error', message: 'The given verification code is already expired'
      });
      if ((emailVerificationCode.code !== verification_code) || (emailVerificationCode.user_id !== user?.id)) return res.status(400).json({
        status: 'Error', message: 'The given verification code is invalid!'
      });

      await User.update({ email_verified_at: new Date().toISOString() }, { where: { id: user.id }});
      await EmailVerificationCode.update({ deleted_at: new Date().toISOString() }, { where: { user_id: user.id }});
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Email verified successfully' });
  };

  public static requestNewEmailVerificationCode = async (req: Request, res: Response) => {
    const { id, email, username } = req.body.userData;

    try {
      const user = await User.findOne({ where: { id, email, username } }) as userType | null;
      if (user?.email_verified_at !== null) return res.status(400).json({ status: 'Error', message: 'This user\'s email is already verified' });

      await EmailVerificationCode.update({ deleted_at: new Date().toISOString() }, { where: { user_id: id } });
      const verificationCode = nanoid(6);
      await EmailVerificationCode.create({ code: verificationCode, user_id: id, expired_at: new Date((+ new Date()) + (4 * 60 * 60 * 1000)).toISOString() });
      await this.mailService.sendMail({
        to: email,
        subject: 'Email Verification Code',
        text: `Hello ${username}!\nuse this code to verify your email: ${verificationCode}`
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Success, new email verification code has been sent' });
  };

  public static getUser = async (req: Request, res: Response) => {
    let { username } = req.params;
    const { userData } = req.body;
    if (!username) username = userData.username;

    let user: userType | null;
    let profile: profileType | null;
    let profileImage;
    let coverImage;
    let followers;
    let following;
    try {
      user = await User.findOne({ where: { username } }) as userType | null;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      profile = await Profile.findOne({ where: { user_id: user.id } }) as profileType | null;
      if (!profile) throw new Error();
      profileImage = await ProfileMedia.findOne({ where: { context: 'PROFILE_IMAGE', profile_id: profile.id } }) as profileMediaType | null;
      coverImage =  await ProfileMedia.findOne({ where: { context: 'COVER_IMAGE', profile_id: profile.id } }) as profileMediaType | null;
      followers = await HasFollower.findAll({ where: {  followed_user_id: user.id, deleted_at: null } }) as unknown;
      following = await HasFollower.findAll({ where: {  following_user_id: user.id, deleted_at: null } }) as unknown;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    const { email, username: userName } = user;
    const { bio } = profile;
    const isMe = (email === userData.email) && (userName === userData.username) && (user.id === userData.id);
    const userFollowers: {
      username: string | undefined,
      name: string | null | undefined
    }[] = [];
    const userFollowing: {
      username: string | undefined,
      name: string | null | undefined
    }[] = [];

    try {
      for(const followerUser of (followers as hasFollowerType[])) {
        const user = await User.findOne({ where: { id: followerUser.following_user_id } }) as userType | null;
        userFollowers.push({
          username: user?.username,
          name: user?.name
        });
      }

      for(const followingUser of (following as hasFollowerType[])) {
        const user = await User.findOne({ where: { id: followingUser.followed_user_id } }) as userType | null;
        userFollowing.push({
          username: user?.username,
          name: user?.name
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
          name: user.name,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          profile: {
            bio,
            location: profile.location,
            profile_image: {
              file_name: profileImage?.file_name ?? 'default.jpg',
              file_mime_type: profileImage?.file_mime_type ?? 'image/jpg',
            },
            cover_image: {
              file_name: coverImage?.file_name ?? 'default.jpg',
              file_mime_type: coverImage?.file_mime_type ?? 'image/jpg',
            }
          },
          followers: userFollowers,
          following: userFollowing,
          isMe
        }
      }
    });
  };

  public static updateProfile = async (req: Request, res: Response) => {
    const { userData } = req.body;
    const { bio, location, name } = req.body;

    try {
      const user = await User.findOne({ where: { id: userData.id } }) as userType | null;
      await Profile.update({ location: location ?? null, bio: bio ?? null }, { where: { user_id: user?.id } });
      await User.update({ name: name ?? null }, { where: { id: user?.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Profile updated successfully' });
  };

  public static updateProfileImage = async (req: Request, res: Response) => {
    const { userData } = req.body;
    const profile_image = req.files?.profile_image as UploadedFile | null;

    if (!profile_image) return res.status(400).json({ status: 'Error', message: 'Profile image\'s file is required' });
    if (profile_image.size > (5 * 1024 * 1024)) return res.status(400).json({ status: 'Error', message: 'Please upload an image lower than 5 mb.' });

    try {
      const newFileName = `${+ new Date()}${profile_image.name.split('.')[0]}.${profile_image.name.split('.')[profile_image.name.split('.').length-1]}`;
      const profile = await Profile.findOne({ where: { user_id: userData.id } }) as profileType | null;
      await ProfileMedia.update({ file_mime_type: profile_image.mimetype, file_name: newFileName }, { where: { profile_id: profile?.id, context: 'PROFILE_IMAGE' } });
      await profile_image.mv(`public/media/images/profile_images/${newFileName}`);
    }catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Profile image changed successfully' });
  };

  public static updateCoverImage = async (req: Request, res: Response) => {
    const { userData } = req.body;
    const cover_image = req.files?.cover_image as UploadedFile;

    if (!cover_image) return res.status(400).json({ status: 'Error', message: 'Cover image\'s file is required' });
    if (cover_image.size > (5 * 1024 * 1024)) return res.status(400).json({ status: 'Error', message: 'Please upload an image lower than 5 mb.' });

    try {
      const newFileName = `${+ new Date()}${cover_image.name.split('.')[0]}.${cover_image.name.split('.')[cover_image.name.split('.').length-1]}`;
      const profile = await Profile.findOne({ where: { user_id: userData.id } }) as profileType | null;
      await ProfileMedia.update({ file_mime_type: cover_image.mimetype, file_name: newFileName }, { where: { profile_id: profile?.id, context: 'COVER_IMAGE' } });
      await cover_image.mv(`public/media/images/cover_images/${newFileName}`);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Cover image changed successfully' });
  };

  public static follow = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { userData } = req.body;

    try {
      const user = await User.findOne({ where: { username } }) as userType | null;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: user?.id, following_user_id: userData.id, deleted_at: null } });
      if (hasFollower) return res.status(400).json({ status: 'Error', message: `You already following ${username}`});
      if (user.id === userData.id) return res.status(400).json({ status: 'Error', message: 'You can\'t follow yourself' });
      await HasFollower.create({ followed_user_id: user?.id, following_user_id: userData.id });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully follow user' });
  };

  public static unfollow = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { userData } = req.body;

    try {
      const user = await User.findOne({ where: { username } }) as userType | null;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      if (user.id === userData.id) return res.status(400).json({ status: 'Error', message: 'You can\'t unfollow yourself' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: user.id, following_user_id: userData.id, deleted_at: null } });
      if (!hasFollower) return res.status(400).json({ status: 'Error', message: `You're not following ${username}` });
      await HasFollower.update({ deleted_at: new Date().toISOString() }, { where: { followed_user_id: user.id, following_user_id: userData.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Error', message: 'Successfully unfollow user' });
  };

  public static changePassword = async (req: Request, res: Response) => {
    const { current_password, password, password_confirmation, userData } = req.body;
    if (password.length < 8) return res.status(400).json({ status: 'Error', message: 'A' });
    if (password !== password_confirmation) return res.status(400).json({ status: 'Error', message: 'New password and password confirmation doesn\'t match' });

    try {
      const user = await User.findOne({ where: { id: userData.id } }) as userType | null;
      const comparationResult = await bcrypt.compare(current_password, user?.password as string);
      if (!comparationResult) return res.status(401).json({ status: 'Error', message: 'Password incorrect' });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.update({ password: hashedPassword }, { where: { id: user?.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Password changed successfully' });
  };

  public static changeEmail = async (req: Request, res: Response) => {
    const { email, password, userData } = req.body;
    try {
      const user = await User.findOne({ where: { id: userData.id } }) as userType | null;
      if (!user) throw new Error();
      const comparationResult = await bcrypt.compare(password, user.password);
      if (!comparationResult) return res.status(401).json({ status: 'Password incorrect' });
      const verificationCode = nanoid(6);
      await EmailVerificationCode.update({ deleted_at: new Date().toISOString() }, { where: { user_id: user.id } });
      await EmailVerificationCode.create({ user_id: user.id, code: verificationCode, expired_at: new Date((+ new Date() + (4 * 60 * 60 * 1000))) });
      await User.update({ email_verified_at: null, email }, { where: { id: user.id } });
      await this.mailService.sendMail({
        to: email,
        subject: 'Email Verification Code',
        text: `Hello ${user.username}!\nuse this code to verify your email: ${verificationCode}`
      });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Insternal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Email changed successfully, check your email for verification code' });
  };
}

export default UserController;
