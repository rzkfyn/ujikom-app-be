import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const CommentLike = Database.define('CommentLike', {
  comment_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
},{
  paranoid: true
});

export default CommentLike;
