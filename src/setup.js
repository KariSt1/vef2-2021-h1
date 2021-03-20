import fastcsv from 'fast-csv';
import fs from 'fs';
// eslint-disable-next-line import/no-unresolved
import { readFile } from 'fs/promises';
import { query, end, insertGenre } from './utils/db.js';
import { requireEnv } from './utils/requireEnv.js';

const schemaFile = './sql/schema.sql';
const dropTablesFile = './sql/drop.sql';

requireEnv(['DATABASE_URL']); // , 'CLOUDINARY_URL']);

async function insertSeries() {
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

      const seriesQuery = 'INSERT INTO tvshows (id, name, air_date, inProduction, tagline, image, description, language, network, homepage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
      const linkQuery = 'INSERT INTO tvshows_genres (tvshow_id, genre_name) VALUES ($1, $2)';

      csvData.forEach(async (row) => {
        const seriesID = row[0];
        const genres = row[3].split(',');
        row.splice(3, 1);
        try {
          console.log('Serie query, id: ', seriesID);
          await query(seriesQuery, row);
          console.log('Serie query búið');
          genres.forEach(async (genre) => {
            console.log('Genre query');
            await insertGenre(genre);
            await query(linkQuery, [seriesID, genre]);
          });
        } catch (e) {
          console.error(e);
        }
      });
    });

  await new Promise((resolve) => {
    stream.pipe(csvStream)
      .on('finish', resolve);
  });
}

async function insertSeasons() {
  const stream = fs.createReadStream('./data/seasons.csv');
  const csvData = [];
  const csvStream = fastcsv
    .parse()
    .on('data', (data) => {
      csvData.push(data);
    })
    .on('end', () => {
      // remove the first line: header
      csvData.shift();

      const seasonQuery = 'INSERT INTO seasons (name,number,air_date,overview,poster,serie,serie_id) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const seasonQueryEmptyDate = 'INSERT INTO seasons (name,number,overview,poster,serie,serie_id) VALUES ($1, $2, $3, $4, $5, $6)';

      csvData.forEach(async (row) => {
        console.log('Season query, id: ', row[0]);
        try {
          if (row[2] === '') {
            row.splice(2, 1);
            await query(seasonQueryEmptyDate, row);
          }
          else {
            await query(seasonQuery, row);
          }
        } catch (e) {
          console.error(e);
        }
        console.log('Season query búið');
      });
    });

  await new Promise((resolve) => {
    stream.pipe(csvStream)
      .on('finish', resolve);
  });
}

async function insertEpisodes() {
  const stream = fs.createReadStream('./data/episodes.csv');
  const csvData = [];
  const csvStream = fastcsv
    .parse()
    .on('data', (data) => {
      csvData.push(data);
    })
    .on('end', () => {
      // remove the first line: header
      csvData.shift();

      const selectSeasonIDQuery = 'SELECT id FROM seasons WHERE serie_id=$1 AND number=$2';
      const episodeQuery = 'INSERT INTO episodes (name,number,air_date,overview,season,serie_id,season_id) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const episodeQueryEmptyDate = 'INSERT INTO episodes (name,number,overview,season,serie_id,season_id) VALUES ($1, $2, $3, $4, $5, $6)';

      csvData.forEach(async (row) => {
        try {
          const seasonResult = await query(selectSeasonIDQuery, [row[6], row[4]]);
          const seasonId = seasonResult.rows[0].id;
          //row.splice(6, 1);
          row.splice(5, 1);
          row.push(seasonId);
          if (row[2] === '') {
            row.splice(2, 1);
            await query(episodeQueryEmptyDate, row);
          }
          else {
            await query(episodeQuery, row);
          }
        } catch (e) {
          console.error(e);
        }
      });
    });

  await new Promise((resolve) => {
    stream.pipe(csvStream)
      .on('finish', resolve);
  });
}

async function create() {
  const dropTables = await readFile(dropTablesFile);

  await query(dropTables.toString('utf-8'));

  const schemaData = await readFile(schemaFile);

  await query(schemaData.toString('utf-8'));

  await insertSeries();
  await insertSeasons();
  await insertEpisodes();

  //await end();

  console.info('Schema created');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
