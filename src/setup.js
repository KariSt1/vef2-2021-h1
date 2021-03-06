import fastcsv from 'fast-csv';
import fs from 'fs';
// eslint-disable-next-line import/no-unresolved
import { readFile } from 'fs/promises';
import { query, insertGenre } from './utils/db.js';
import { requireEnv } from './utils/requireEnv.js';
import { uploadImageIfNotUploaded } from './data/images.js';

const schemaFile = './sql/schema.sql';
const dropTablesFile = './sql/drop.sql';
const insertUsersFile = './sql/insertUsers.sql';

requireEnv(['DATABASE_URL', 'CLOUDINARY_URL']);

const {
  IMAGE_FOLDER: imageFolder = './data/img',
} = process.env;

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
        const series = row;
        const seriesID = series[0];
        const genres = series[3].split(',');
        series.splice(3, 1);
        try {
          const image = await uploadImageIfNotUploaded(`${imageFolder}/${series[5]}`);
          series[5] = image;
          await query(seriesQuery, series);
          genres.forEach(async (genre) => {
            await insertGenre(genre);
            await query(linkQuery, [seriesID, genre]);
          });
        } catch (e) {
          console.error(e);
        }
      });
    });

  return new Promise((resolve) => {
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
        const season = row;
        try {
          const image = await uploadImageIfNotUploaded(`${imageFolder}/${season[4]}`);
          season[4] = image;
          if (season[2] === '') {
            season.splice(2, 1);
            await query(seasonQueryEmptyDate, season);
          } else {
            await query(seasonQuery, season);
          }
        } catch (e) {
          console.error(e);
        }
      });
    });

  return new Promise((resolve) => {
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
          row.splice(5, 1);
          row.push(seasonId);
          if (row[2] === '') {
            row.splice(2, 1);
            await query(episodeQueryEmptyDate, row);
          } else {
            await query(episodeQuery, row);
          }
        } catch (e) {
          console.error(e);
        }
      });
    });

  return new Promise((resolve) => {
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
  setTimeout(async () => {
    await insertSeasons();
    // eslint-disable-next-line no-console
    console.log('Seasons inserted');
  }, 9000);
  setTimeout(async () => {
    await insertEpisodes();
    await query("SELECT setval(pg_get_serial_sequence('tvshows', 'id'), 20, true)");
    // eslint-disable-next-line no-console
    console.log('Episodes inserted');
  }, 15000);
  setTimeout(async () => {
    const insertUsersData = await readFile(insertUsersFile);

    await query(insertUsersData.toString('utf-8'));
    // eslint-disable-next-line no-console
    console.log('Users inserted');
  }, 18000);
  console.info('Schema created');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
