import { Request, Response } from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Database from '../core/Database.js';

class ProfileController {
  public static updateProfile = async (req: Request, res: Response) => {
    const { bio, location, name, url, date_of_birth } = req.body;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;
    if (!date_of_birth) return res.status(400).json({ status: 'Error', message: 'Date of birth is required!' });

    const transaction = await Database.transaction();
    try {
      await Profile.update({ 
        location: location ?? null, bio: bio ?? null, url: url ?? null, date_of_birth: new Date(date_of_birth).toISOString() 
      }, { where: { user_id: authorizedUser.id }, transaction });
      await User.update({ name: name ?? null }, { where: { id: authorizedUser.id}, transaction });
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Profile updated successfully' });
  };
}

export default ProfileController;
