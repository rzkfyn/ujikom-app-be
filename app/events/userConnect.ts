import { Model } from 'sequelize';
import { Socket } from 'socket.io';
import Database from '../core/Database.js';
import eventEmitter from '../core/Event.js';
import UserPresence from '../models/UserPresence.js';

export default {
  name: 'userconnect',
  execute: async ({ socket, data }: {
    socket: Socket, data: unknown
  }) => {
    eventEmitter.on('notificationchange', (forUserId: number) => socket.emit('notificationchange', { forUserId }));
    eventEmitter.on('poststatechange', (postCode: string) => socket.emit('poststatechange', { postCode }));
    if (data === 'guest') return;

    const transaction = await Database.transaction();
    try {
      const userPresence = await UserPresence.findOne({ where: { user_id: data } }) as Model | null;
      if (!userPresence) {
        await UserPresence.create({ user_id: data, status: 'ONLINE', transaction });
      } else {
        await userPresence.update({ status: 'ONLINE', last_seen: null, transaction });
      }
      await transaction.commit();
    } catch(e) {
      await transaction.rollback();
    }
    eventEmitter.emit('userpresencechange', data);

    socket.on('disconnect', async () => {
      eventEmitter.emit('userpresencechange', data);
      await UserPresence.update({ status: 'OFFLINE', last_seen: new Date().toISOString() }, { where: { user_id: data } });
    });
  }
};
