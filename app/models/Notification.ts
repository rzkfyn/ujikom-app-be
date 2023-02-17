import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const Notification = Database.define('Notification', {
  receiver_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  event: {
    type: DataTypes.ENUM('USER_FOLLOW', 'USER_MENTION_ON_POST', 'USER_MENTION_ON_BIO', 'USER_MENTION_ON_COMMENT', 'POST_LIKE', 'POST_SHARE', 'POST_COMMENT', 'COMMENT_LIKE', 'COMMENT_REPLY'),
    allowNull: false
  },
  fired_by_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  related_event_id: { 
    type: DataTypes.BIGINT,
    allowNull: true
  },
  seen_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  paranoid: true
});

export default Notification;
