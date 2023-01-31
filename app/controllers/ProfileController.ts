import { Request, Response } from 'express';
import { Model } from 'sequelize';
import { UploadedFile } from 'express-fileupload';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import ProfileMedia from '../models/ProfileMedia.js';
import type { profile as profileType } from '../types/types.js';

class ProfileController {
  public static updateProfile = async (req: Request, res: Response) => {
    const { userData } = req.body;
    const { bio, location, name } = req.body;

    try {
      await Profile.update({ location: location ?? null, bio: bio ?? null }, { where: { user_id: userData.id } });
      await User.update({ name: name ?? null }, { where: { id: userData.id} });
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
      const profile = await Profile.findOne({ where: { user_id: userData.id } }) as Model<profileType, profileType>;
      await ProfileMedia.update({ file_mime_type: profile_image.mimetype, file_name: newFileName }, { where: { profile_id: profile.dataValues.id, context: 'PROFILE_IMAGE' } });
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
      const profile = await Profile.findOne({ where: { user_id: userData.id } }) as Model<profileType, profileType>;
      await ProfileMedia.update({ file_mime_type: cover_image.mimetype, file_name: newFileName }, { where: { profile_id: profile.dataValues.id, context: 'COVER_IMAGE' } });
      await cover_image.mv(`public/media/images/cover_images/${newFileName}`);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Cover image changed successfully' });
  };
}

export default ProfileController;
