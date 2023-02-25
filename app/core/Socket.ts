import { Server } from 'socket.io';
import { readdirSync } from 'fs';

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
  };
}

export default Socket;
