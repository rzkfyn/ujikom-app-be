import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import EmailVerificationCode from '../models/EmailVerificationCode.js';
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
    try {
      user = await User.findOne({ where: { username } }) as userType | null;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      profile = await Profile.findOne({ where: { user_id: user.id } }) as profileType | null;
      if (!profile) throw new Error();
      profileImage = await ProfileMedia.findOne({ where: { context: 'PROFILE_IMAGE', profile_id: profile.id } }) as profileMediaType | null;
      coverImage =  await ProfileMedia.findOne({ where: { context: 'COVER_IMAGE', profile_id: profile.id } }) as profileMediaType | null;
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    const { email, username: userName } = user;
    const { bio } = profile;
    const isMe = (email === userData.email) && (userName === userData.username) && (user.id === userData.id);

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
            profile_image: {
              file_name: profileImage?.file_name ?? 'default.jpg',
              file_mime_type: profileImage?.file_mime_type ?? 'default.jpg',
            },
            cover_image: {
              file_name: coverImage?.file_name,
              file_mime_type: coverImage?.file_mime_type,
            }
          },
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
}

export default UserController;
