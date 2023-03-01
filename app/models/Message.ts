import Database from '../core/Database.js';
import { DataTypes } from 'sequelize';

const Message = Database.define('Message', {
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('SENT', 'RECEIVED', 'SEEN'),
  },
  deleted_from_sender: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deleted_from_receiver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

export default Message;
