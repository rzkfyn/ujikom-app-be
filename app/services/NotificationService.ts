import { Transaction } from 'sequelize';
import Notification from '../models/Notification.js';
import eventEmitter from '../core/Event.js';
import Comment from '../models/Comment.js';

type event = 'USER_FOLLOW' | 'USER_FOLLOW_REQUEST' | 'USER_FOLLOW_REQUEST_ACCEPTED' | 'USER_FOLLOW_REQUSERT_REJECTED' | 'USER_MENTION_ON_POST' | 'USER_MENTION_ON_BIO' | 'USER_MENTION_ON_COMMENT' | 'POST_LIKE' | 'POST_SHARE' | 'POST_COMMENT' | 'COMMENT_LIKE' | 'COMMENT_REPLY';

class NotificationService {
  public createNotification = async (receiverUserId: number, firedByUserId: number, context: event, relatedEventId: number | null, transaction: Transaction) => {
    if (receiverUserId === firedByUserId) return true;

    const notification = await Notification.create({ 
      receiver_user_id: receiverUserId, fired_by_user_id: firedByUserId, event: context, related_event_id: relatedEventId
    }, {
      transaction 
    });
    eventEmitter.emit('notificationchange', receiverUserId);
    return notification?.toJSON();
  };

  public removeNotification = async (receiverUserId: number, firedByUserId: number, context: event, relatedEventId: number | null, transaction: Transaction) => {
    const notification = await Notification.findOne({ 
      where: {
        receiver_user_id: receiverUserId, fired_by_user_id: firedByUserId, event: context, related_event_id: relatedEventId
      }
    });
    if (!notification) return false;
    await notification.destroy({ transaction });
    eventEmitter.emit('notificationchange', receiverUserId);
    return true;
  };

  public removeNotificationsByEvent = async (context: string, relatedEventId: number, transaction: Transaction) => {
    if (context === 'post') return await Notification.destroy({ where: { related_event_id: relatedEventId }, transaction });
    if (context === 'comment') return await Comment.destroy({ where: { related_event_id: relatedEventId }, transaction });
  };
}

export default NotificationService;
