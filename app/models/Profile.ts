import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const Profile = Database.define('Profile', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE'),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true
  }
},{
  paranoid: true
});

export default Profile;
