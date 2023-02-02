import Database from '../../app/core/Database.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';

(async () => {
  let tables = readdirSync(resolve('app', 'models'))
    .map((table) => table.replace(/(.ts|.js)/, ''));
  try {
    tables.forEach(async (table) => {
      await Database.query(`DROP TABLE IF EXISTS ${table};`);
      await Database.query(`DROP TABLE IF EXISTS ${table.toLowerCase()};`);
      const tableName = table.endsWith('y') ? table.replace('y', 'ies') : `${table}s`;
      await Database.query(`DROP TABLE IF EXISTS ${tableName};`);
      await Database.query(`DROP TABLE IF EXISTS ${tableName.toLowerCase()};`);
    });

    setTimeout(async () => {
      tables = readdirSync(resolve('app', 'models'))
        .map((table) => table.replace(/(.ts)/, '.js'));
      tables.forEach(async (table) => {
        await import(`../../app/models/${table}`);
        await Database.sync();
      });
    }, 3000);
  } catch(e) {
    console.log(e);
  }
})();
