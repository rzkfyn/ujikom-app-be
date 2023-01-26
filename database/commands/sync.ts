import Database from '../../app/core/Database.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';

(async () => {
  const tables = readdirSync(resolve('app', 'models'))
    .map((table) => table.replace(/(.ts)/, '.js'));
  tables.forEach(async (table) => {
    await import(`../../app/models/${table}`);
    await Database.sync();
  });
})();
