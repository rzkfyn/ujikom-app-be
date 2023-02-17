import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const MentionedUserOnPost = Database.define('MentionedUserOnPost', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  paranoid: true
});

export default MentionedUserOnPost;
