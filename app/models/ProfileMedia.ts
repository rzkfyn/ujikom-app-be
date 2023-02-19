import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const ProfileMedia = Database.define('ProfileMedia', {
  profile_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_mime_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  context: {
    type: DataTypes.ENUM('PROFILE_IMAGE', 'COVER_IMAGE'),
    allowNull: false
  }
},{
  paranoid: true
});

export default ProfileMedia;
