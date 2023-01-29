import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const User = Database.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
},{
  paranoid: true
});

export default User;
