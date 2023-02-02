import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const Comment = Database.define('Comment', {
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  replied_comment_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: true,
  }
},{
  paranoid: true
});

export default Comment;
