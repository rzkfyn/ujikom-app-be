import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const PinnedPost = Database.define('PinnedPost', {
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false  
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
});

export default PinnedPost;
