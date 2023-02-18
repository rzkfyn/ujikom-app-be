import { Request, Response } from 'express';
import { Model } from 'sequelize';
import User from '../models/User.js';
import HasFollower from '../models/HasFollower.js';
import UserService from '../services/UserService.js';
import NotificationService from '../services/NotificationService.js';
import type {
  User as userType,
  HasFollower as hasFollowerType,
} from '../types/types.js';
import Database from '../core/Database.js';

class FollowerController {
  private static userService = new UserService();
  private static notificationService = new NotificationService();

  public static follow = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: user.dataValues.id, follower_user_id: authorizedUser.id } }) as Model<hasFollowerType, hasFollowerType>;
      if (hasFollower) return res.status(400).json({ status: 'Error', message: `You already following ${username}`});
      if (user.dataValues.id === authorizedUser.id) return res.status(400).json({ status: 'Error', message: 'You can\'t follow yourself' });
      await HasFollower.create({ followed_user_id: user.dataValues.id, follower_user_id: authorizedUser.id }, { transaction });
      await this.notificationService.createNotification(user.dataValues.id, authorizedUser.id, 'FOLLOW', transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully follow user' });
  };

  public static unfollow = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      if (user.dataValues.id === authorizedUser.id) return res.status(400).json({ status: 'Error', message: 'You can\'t unfollow yourself' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: user.dataValues.id, follower_user_id: authorizedUser.id } }) as Model<hasFollowerType, hasFollowerType>;
      if (!hasFollower) return res.status(400).json({ status: 'Error', message: `You're not following ${username}` });
      await HasFollower.destroy({ where: { followed_user_id: user.dataValues.id, follower_user_id: authorizedUser.id }, transaction});
      await this.notificationService.removeNotification(user.dataValues.id, authorizedUser.id, 'FOLLOW', transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Error', message: 'Successfully unfollow user' });
  };

  public static getUserFollowersInfo = async (req: Request, res: Response) => {
    const { username } = req.params;

    let userFollowers;
    try {
      userFollowers = await this.userService.getUserConnectionsInfo(username);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    if (typeof userFollowers === 'boolean') return res.status(404).json({ status: 'Error', message: 'User not found' });
    
    return res.status(200).json({ 
      status: 'Ok',
      message: 'Successfully fetched user\'s followers info',
      data: userFollowers
    });
  };

  public static getUserFollowingInfo = async (req: Request, res: Response) => {
    const { username } = req.params;
    
    let userFollowing;
    try {
      userFollowing = await this.userService.getUserConnectionsInfo(username, 'following');
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({
      status: 'Ok',
      message: 'Successfully fetched user\'s following info',
      data: userFollowing
    });
  };

  public static removeFollower = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      const hasFollower = await HasFollower.findOne({ where: { followed_user_id: authorizedUser.id, follower_user_id: user.dataValues.id } }) as Model<hasFollowerType, hasFollowerType> | null;
      if (!hasFollower) return res.status(400).json({ status: 'Error', message: `${username} didn't follow your account` });
      await hasFollower.destroy();
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: `${username} removed from your follower list` });
  };
}

export default FollowerController;
