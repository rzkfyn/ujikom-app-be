import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const FollowRequest = Database.define('follow_request', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requested_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false, 
  }
}, {
  paranoid: true,
});

export default FollowRequest;
