import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0);

export default eventEmitter;
