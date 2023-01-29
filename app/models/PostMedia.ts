import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const PostMedia = Database.define('PostMedia', {
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  file_mime_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
},{
  paranoid: true
});

export default PostMedia;
