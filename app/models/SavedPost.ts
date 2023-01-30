import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const SavedPost = Database.define('SavedPost', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  paranoid: true
});

export default SavedPost;
