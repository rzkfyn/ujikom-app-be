import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const PostLike = Database.define('PostLike', {
  post_id: {
    type: DataTypes.BIGINT
  },
  user_id: {
    type: DataTypes.BIGINT
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

export default PostLike;
