import fastcsv from 'fast-csv';
import fs from 'fs';
// eslint-disable-next-line import/no-unresolved
import { readFile } from 'fs/promises';
import { query, end, insertGenre } from './utils/db.js';
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
      const genreQuery = 'INSERT INTO genres (name) VALUES ($1)';
      const linkQuery = 'INSERT INTO tvshows_genres (tvshow_id, genre_name) VALUES ($1, $2)';

      csvData.forEach(async (row) => {
        const seriesID = row[0];
        const genres = row[3].split(',');
        row.splice(3, 1);
        try {
          await query(seriesQuery, row);
        } catch (e) {
          console.error(e);
        }
        genres.forEach(async (genre) => {
          try {
            await insertGenre(genre);
            await query(linkQuery, [seriesID, genre]);
          } catch (e) {
            console.error(e);
          }
        });
      });
    });

  stream.pipe(csvStream);

  //await end();

  console.info('Schema created');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
