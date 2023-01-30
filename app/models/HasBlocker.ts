import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const HasBlocker = Database.define('HasBlocker', {
  blocked_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  blocker_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  paranoid: true
});

export default HasBlocker;
