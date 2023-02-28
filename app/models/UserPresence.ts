import { DataTypes } from 'sequelize';
import Database from '../core/Database.js';

const UserPresence = Database.define('UserPresence', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ONLINE', 'OFFLINE'),
    allowNull: false,
    defaultValue: 'ONLINE'
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hidden: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

export default UserPresence;
