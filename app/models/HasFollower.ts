import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const HasFollower = Database.define('HasFollower', {
  followed_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  follower_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
},{
  paranoid: true
});

export default HasFollower;
