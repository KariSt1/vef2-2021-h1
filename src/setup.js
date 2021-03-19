import fastcsv from 'fast-csv';
import fs from 'fs';
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

  const schemaData = await readFile(schemaFile);

  await query(schemaData.toString('utf-8'));

  const stream = fs.createReadStream('./data/series.csv');
  const csvData = [];
  const csvStream = fastcsv
    .parse()
    .on('data', (data) => {
      csvData.push(data);
    })
    .on('end', () => {
      // remove the first line: header
      csvData.shift();

      const seriesQuery = 'INSERT INTO tvshows (id, name, airDate, inProduction, tagline, image, description, language, network, homepage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';

      csvData.forEach(async (row) => {
        console.log('Fyrir', row);
        row.splice(3, 1);
        console.log('Eftir', row);
        try {
          await query(seriesQuery, row);
        } catch (e) {
          console.error(e);
        }
      });
    });

  stream.pipe(csvStream);
  /* const seriesQuery = 'INSERT INTO tvshows (id, name, airDate, inProduction, tagline, image, description, language, network, homepage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
  const results = [];
  fs.createReadStream('./data/series.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      //console.log(results);
      results.forEach(async (result) => {
        const { genres } = result;
        console.log('Genres: ', genres);
        // eslint-disable-next-line no-param-reassign
        delete result.genres;
        console.log(result);
        try {
          const test = JSON.parse(result.toString());
          console.log(test);
          await query(seriesQuery, test);
        } catch (e) {
          console.error(e);
        }
      });
      // [
      //   { NAME: 'Daffy Duck', AGE: '24' },
      //   { NAME: 'Bugs Bunny', AGE: '22' }
      // ]
    }); */

  //await end();

  console.info('Schema created');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
