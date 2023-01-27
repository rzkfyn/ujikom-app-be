import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { nanoid } from 'nanoid';
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
  profileMedia as profileMediaType
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
      followers = await HasFollower.findAll({ where: {  followed_user_id: user.id, deleted_at: null } });
      following = await HasFollower.findAll({ where: {  following_user_id: user.id, deleted_at: null } });  
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    const { email, username: userName } = user;
    const { bio } = profile;
    const isMe = (email === userData.email) && (userName === userData.username) && (user.id === userData.id);
    // @ts-ignore
    followers = followers.map((follower) => ({ user_id: follower.following_user_id }));
    // @ts-ignore
    following = following.map((following) => ({ user_id: following.following_user_id }));

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
          followers,
          following,
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
}

export default UserController;
