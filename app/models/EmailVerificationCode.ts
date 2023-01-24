import { DataTypes } from 'sequelize';
import Database  from '../core/Database.js';

const EmailVerificationCode = Database.define('EmailVerificationCode', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expired_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

export default EmailVerificationCode;
