import { Request, Response } from 'express';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import User from '../models/User.js';

class NotificationController {
  public static getNotifications = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    let result;
    try {
      const notifications = await Notification.findAll({ where: { receiver_user_id: authorizedUser.id },
        include: {
          model: User,
          as: 'fired_by_user',
          attributes: [ 'id', 'username', 'name', 'createdAt', 'email_verified_at' ],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: [ 'bio', 'age', 'location', 'gender', 'url', 'date_of_birth' ],
              include: [
                {
                  model: ProfileMedia,
                  as: 'profile_media',
                  attributes: [ 'file_name', 'file_mime_type', 'context' ]
                },
              ]
            }
          ]
        } });
      result = notifications.map((notification) => notification.toJSON());
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully fetch notifications', data: result });
  };
}

export default NotificationController;
