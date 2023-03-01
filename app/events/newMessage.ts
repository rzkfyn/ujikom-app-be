import { Socket } from 'socket.io';
import eventEmitter from '../core/Event.js';

export default {
  name: 'newmessage',
  execute: async ({ _, data }: {
    _: Socket, data: unknown
  }) => {
    eventEmitter.emit('newmessage', data);
  }
};
