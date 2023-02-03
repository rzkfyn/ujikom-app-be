import { Request, Response } from 'express';
import { Model } from 'sequelize';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import HasFollower from '../models/HasFollower.js';
import type {
  user as userType,
  hasFollower as hasFollowerType,
  profile as profileType,
  profileMedia as profileMediaType
} from '../types/types.js';
import ProfileMedia from '../models/ProfileMedia.js';

class FollowerController {
  public static follow = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { userData } = req.body;

    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: user.dataValues.id, follower_user_id: userData.id } }) as Model<hasFollowerType, hasFollowerType>;
      if (hasFollower) return res.status(400).json({ status: 'Error', message: `You already following ${username}`});
      if (user.dataValues.id === userData.id) return res.status(400).json({ status: 'Error', message: 'You can\'t follow yourself' });
      await HasFollower.create({ followed_user_id: user.dataValues.id, follower_user_id: userData.id });
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
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      if (user.dataValues.id === userData.id) return res.status(400).json({ status: 'Error', message: 'You can\'t unfollow yourself' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: user.dataValues.id, follower_user_id: userData.id } }) as Model<hasFollowerType, hasFollowerType>;
      if (!hasFollower) return res.status(400).json({ status: 'Error', message: `You're not following ${username}` });
      await HasFollower.destroy({ where: { followed_user_id: user.dataValues.id, follower_user_id: userData.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Error', message: 'Successfully unfollow user' });
  };

  public static getUserFollowersInfo = async (req: Request, res: Response) => {
    const result = [];
    const { username } = req.params;

    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType> | null;
      if (!user) return res.status(404).json({ status: 'Error', message: 'Internal server error' });
      const userFollowers = await HasFollower.findAll({ where: { followed_user_id: user?.dataValues.id } }) as unknown;
  
      for (const userFollower of userFollowers as Model<hasFollowerType, hasFollowerType>[]) {
        const user = await User.findOne({ where: { id: userFollower.dataValues.follower_user_id } }) as Model<userType, userType> | null;
        const profile = await Profile.findOne({ where: { user_id: user?.dataValues.id } }) as Model<profileType, profileType> | null;
        const profileImage = await ProfileMedia.findOne({ where: { profile_id: profile?.dataValues.id, context: 'PROFILE_IMAGE' } }) as Model<profileMediaType, profileMediaType> | null;
        const coverImage = await ProfileMedia.findOne({ where: { profile_id: profile?.dataValues.id, context: 'COVER_IMAGE' } }) as Model<profileMediaType, profileMediaType> | null;
  
        result.push({
          name: user?.dataValues.name,
          username: user?.dataValues.username,
          profile: {
            profile_image: {
              file_name: profileImage?.dataValues.file_name ?? 'default.png',
              file_mime_type: profileImage?.dataValues.file_mime_type ?? 'image/png'
            },
            cover_image: {
              file_name: coverImage?.dataValues.file_name ?? 'default.png',
              file_mime_type: coverImage?.dataValues.file_mime_type ?? 'image/png'
            }
          }
        });
      }
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
    
    return res.status(200).json({ 
      status: 'Ok',
      message: 'Successfully fetched user\'s followers info',
      data: result
    });
  };

  // private static getUserFollowers = async (userId: number) => {
    
  // };
}

export default FollowerController;
