import { Transaction } from 'sequelize';
import Notification from '../models/Notification.js';

type event = 'USER_FOLLOW' | 'USER_MENTION_ON_POST' | 'USER_MENTION_ON_BIO' | 'USER_MENTION_ON_COMMENT' | 'POST_LIKE' | 'POST_SHARE' | 'POST_COMMENT' | 'COMMENT_LIKE' | 'COMMENT_REPLY';

class NotificationService {
  public createNotification = async (receiverUserId: number, firedByUserId: number, context: event, transaction: Transaction) => {
    if (receiverUserId === firedByUserId) return true;

    const notification = await Notification.create({ 
      receiver_user_id: receiverUserId, fired_by_user_id: firedByUserId, event: context 
    }, {
      transaction 
    });
    return notification?.toJSON();
  };

  public removeNotification = async (receiverUserId: number, firedByUserId: number, context: event, transaction: Transaction) => {
    const notification = await Notification.findOne({ 
      where: {
        receiver_user_id: receiverUserId, fired_by_user_id: firedByUserId, event: context
      }
    });
    if (!notification) return false;
    await notification.destroy({ transaction });
    return true;
  };
}

export default NotificationService;
