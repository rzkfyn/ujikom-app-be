import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const CommentMedia = Database.define('CommentMedia', {
  comment_id: {
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

export default CommentMedia;
