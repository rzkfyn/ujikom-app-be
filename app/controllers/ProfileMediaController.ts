import { Request, Response } from 'express';
import { Model, Transaction } from 'sequelize';
import { UploadedFile } from 'express-fileupload';
import Database from '../core/Database.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import type { Profile as profileType } from '../types/types.js';

class ProfileMediaController {
  private static removeProfileMedia = async (userId: number, context: 'PROFILE_IMAGE' | 'COVER_IMAGE', transaction: Transaction) => {
    const profile = await Profile.findOne({ where: { user_id: userId } }) as Model<profileType, profileType> | null;
    if (!profile) throw new Error();
    await ProfileMedia.update({ file_mime_type: null, file_name: null }, { where: { profile_id: profile.dataValues.id, context }, transaction });
  };

  public static removeProfileImage = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      await this.removeProfileMedia(authorizedUser.id as number, 'PROFILE_IMAGE', transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully removed profile image' });
  };

  public static removeCoverImage = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      await this.removeProfileMedia(authorizedUser.id as number, 'COVER_IMAGE', transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully removed cover image' });
  };

  public static updateProfileImage = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user: authorizedUser } = auth;
    const profile_image = req.files?.profile_image as UploadedFile | null;

    if (!profile_image) return res.status(400).json({ status: 'Error', message: 'Profile image\'s file is required' });
    if (profile_image.size > (5 * 1024 * 1024)) return res.status(400).json({ status: 'Error', message: 'Please upload an image lower than 5 mb.' });

    const transaction = await Database.transaction();
    try {
      const newFileName = `${+ new Date()}${profile_image.name.split('.')[0]}.${profile_image.name.split('.')[profile_image.name.split('.').length-1]}`;
      const profile = await Profile.findOne({ where: { user_id: authorizedUser.id } }) as Model<profileType, profileType>;
      console.log(profile);
      await ProfileMedia.update({ file_mime_type: profile_image.mimetype, file_name: newFileName }, { where: { profile_id: profile.dataValues.id, context: 'PROFILE_IMAGE' }, transaction });
      await profile_image.mv(`public/media/images/profile_images/${newFileName}`);
      await transaction.commit();
    }catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Profile image changed successfully' });
  };

  public static updateCoverImage = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user: authorizedUser } = auth;
    const cover_image = req.files?.cover_image as UploadedFile;

    if (!cover_image) return res.status(400).json({ status: 'Error', message: 'Cover image\'s file is required' });
    if (cover_image.size > (5 * 1024 * 1024)) return res.status(400).json({ status: 'Error', message: 'Please upload an image lower than 5 mb.' });

    const transaction = await Database.transaction();
    try {
      const newFileName = `${+ new Date()}${cover_image.name.split('.')[0]}.${cover_image.name.split('.')[cover_image.name.split('.').length-1]}`;
      const profile = await Profile.findOne({ where: { user_id: authorizedUser.id } }) as Model<profileType, profileType>;
      await ProfileMedia.update({ file_mime_type: cover_image.mimetype, file_name: newFileName }, { where: { profile_id: profile.dataValues.id, context: 'COVER_IMAGE' }, transaction });
      await cover_image.mv(`public/media/images/cover_images/${newFileName}`);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Cover image changed successfully' });
  };
}

export default ProfileMediaController;