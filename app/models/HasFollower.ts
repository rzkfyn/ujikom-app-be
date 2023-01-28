import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const HasFollower = Database.define('HasFollower', {
  followed_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  following_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

export default HasFollower;
