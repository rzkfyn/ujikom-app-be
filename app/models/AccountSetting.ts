import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const AccountSetting = Database.define('AccountSetting', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  account_visibility: {
    type: DataTypes.ENUM('PUBLIC', 'PRIVATE'),
    allowNull: false
  }
});

export default AccountSetting;
