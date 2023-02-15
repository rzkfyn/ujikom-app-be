import { Transaction } from 'sequelize';
import Notification from '../models/Notification.js';

type event = 'FOLLOW' | 'LIKE'| 'SHARE' | 'COMMENT';

class NotificationService {
  public createNotification = async (receiverUserId: number, firedByUserId: number, context: event, transaction: Transaction) => {
    const notification = await Notification.create({ 
      receiver_user_id: receiverUserId, fired_by_user_id: firedByUserId, event: context 
    }, {
      transaction 
    });
    return notification?.toJSON();
  };
}

export default NotificationService;
