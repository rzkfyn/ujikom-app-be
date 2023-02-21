import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const SharedPost = Database.define('SharedPost', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  shared_post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
}, {
  paranoid: true
});

export default SharedPost;
