import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const Profile = Database.define('Profile', {
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('MAN', 'WOMAN'),
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
  bio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
},{
  tableName: 'Profiles'
});

export default Profile;
