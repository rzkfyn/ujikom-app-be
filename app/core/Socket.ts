import { Server } from 'socket.io';
import { readdirSync } from 'fs';
import eventEmitter from './Event.js';

class Socket {
  public static init = async (io: Server) => {
    io.on('connection', async (socket) => {
      const eventFiles = readdirSync('./app/events/').filter((file) => file.endsWith('.ts'));

      eventFiles.forEach(async (eventFile) => {
        const event = await import(`../events/${eventFile}`);
        const { default: socketEvent } = event;
        const { name, execute } = socketEvent;

        socket.on(name, (data: unknown) => {
          execute({ socket, data });
        });
      });
    });

    eventEmitter.on('newmessage', (data) => {
      io.emit('newmessage', data);
    });

    // eventEmitter.on('userdisconnect', (data) => {
    //   io.emit('userdisconnect', data);
    // });

    eventEmitter.on('userpresencechange', (data) => {
      io.emit('userpresencechange', { userId: data });
    });
  };
}

export default Socket;
