// eslint-disable-next-line import/no-unresolved
import { readFile } from 'fs/promises';
import { query, end } from './utils/db.js';
import { requireEnv } from './utils/requireEnv.js';

const schemaFile = './sql/schema.sql';
const dropTablesFile = './sql/drop.sql';

requireEnv(['DATABASE_URL']); // , 'CLOUDINARY_URL']);

async function create() {

  const dropTables = await readFile(dropTablesFile);

  await query(dropTables.toString('utf-8'));

  const data = await readFile(schemaFile);

  await query(data.toString('utf-8'));

  await end();

  console.info('Schema created');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});