import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const Tag = Database.define('Tag', {
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  }
}, {
  paranoid: true
});

export default Tag;
