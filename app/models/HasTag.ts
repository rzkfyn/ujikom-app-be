import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const HasTag = Database.define('HasTag', {
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
},{
  paranoid: true
});

export default HasTag;
