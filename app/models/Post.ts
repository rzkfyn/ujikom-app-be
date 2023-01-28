import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const Post = Database.define('Post', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    unique: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

export default Post;
