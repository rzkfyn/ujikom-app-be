import { Socket } from 'socket.io';
import eventEmitter from '../core/Event.js';

export default {
  name: 'userconnect',
  execute: async ({ socket, data }: {
    socket: Socket, data: unknown
  }) => {
    eventEmitter.on('notificationchange', (forUserId: number) => socket.emit('notificationchange', { forUserId }));
    eventEmitter.on('poststatechange', (postCode: string) => socket.emit('poststatechange', { postCode }));
  }
};
