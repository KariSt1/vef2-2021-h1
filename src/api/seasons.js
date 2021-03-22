import multer from 'multer';
import cloudinary from 'cloudinary';
import xss from 'xss';
import { isValid } from 'date-fns';
import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import {
  isInt,
  isNotEmptyString,
  isEmpty,
  lengthValidationError,
  isString,
} from '../utils/validation.js';

const MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
];

async function findSeasons(id, number) {
  if (!isInt(id) && !isInt(number)) {
    return null;
  }

  const seasons = await query(
    `SELECT
        id,name,air_date,overview,poster
      FROM
        seasons
      WHERE serie_id = $1 AND number = $2`,
    [id, number],
  );

  if (seasons.rows.length !== 1) {
    return null;
  }

  return seasons.rows[0];
}

async function findEpisodes(id, number) {
  if (!isInt(id) && !isInt(number)) {
    return null;
  }

  const episodes = await query(
    `SELECT
        name,number,air_date,overview
      FROM
        episodes
      WHERE serie_id = $1 AND season = $2 ORDER BY number `,
    [id, number],
  );

  if (episodes.rows.length === 0) {
    return null;
  }

  return episodes.rows;
}

export async function listSeasons(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const { id } = req.params;

  const seasons = await pagedQuery(
    `SELECT
          id, name, number, air_date, overview, poster
        FROM
          seasons
        WHERE serie_id = $1 ORDER BY id`,
    [id],
    { offset, limit },
  );

  const seasonsWithPage = addPageMetadata(
    seasons,
    req.path,
    { offset, limit, length: seasons.items.length },
  );

  return res.json(seasonsWithPage);
}

export async function listSeason(req, res) {
  const { id, number } = req.params;

  const season = await findSeasons(id, number);
  const episodes = await findEpisodes(id, number);

  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }

  return res.json({
    season,
    episodes,
  });
}

export async function deleteSeason(req, res) {
  const { id, number } = req.params;

  const q = 'DELETE FROM seasons WHERE serie_id = $1 AND number = $2';

  await query(q, [id, number]);

  return res.json({});
}

function validateImageMimetype(mimetype) {
  return MIMETYPES.indexOf(mimetype.toLowerCase()) >= 0;
}

async function withMulter(req, res, next, fn) {
  multer({ dest: './temp' })
    .single('image')(req, res, (err) => {
      if (err) {
        if (err.message === 'Unexpected field') {
          const errors = [{
            field: 'image',
            error: 'Unable to read image',
          }];
          return res.status(400).json({ errors });
        }

        return next(err);
      }

      return fn(req, res, next).catch(next);
    });
}

async function validateSeasons(
  {
    name, number, airDate, overview, serie,
  } = {},
  patching = false,
) {
  const validation = [];
  // Name validation
  if (!patching || name || isEmpty(name)) {
    if (!isNotEmptyString(name, { min: 1, max: 128 })) {
      validation.push({
        msg: `name is required ${lengthValidationError(name, 1, 128)}`,
        param: 'name',
        location: 'body',
      });
    }
  }

  // number validation
  if (!patching || number || isEmpty(number)) {
    if (!isInt(number) || (number < 0) || (number > 5)) {
      validation.push({
        msg: 'number must be an integer between 0 and 5',
        param: 'number',
        location: 'body',
      });
    }
  }

  // airDate validation
  if (!patching || airDate || isEmpty(airDate)) {
    if (!isValid(new Date(airDate))) {
      validation.push({
        msg: 'airDate must be a date',
        param: 'airDate',
        location: 'body',
      });
    }
  }

  // overview validation
  if (!patching || overview || isEmpty(overview)) {
    if (overview !== null && !isString(overview)) {
      validation.push({
        msg: 'overview must be a string',
        param: 'overview',
        location: 'body',
      });
    }
  }

  // serie validation
  if (!patching || serie || isEmpty(serie)) {
    if (!isNotEmptyString(serie, { min: 1, max: 128 })) {
      validation.push({
        msg: `serie is required ${lengthValidationError(name, 1, 128)}`,
        param: 'serie',
        location: 'body',
      });
    }
  }

  return validation;
}

async function createSeasonsWithImage(req, res, next) {
  const { id } = req.params;
  if (!isInt(id)) {
    return null;
  }

  const {
    name, number, airDate = null, overview = null,
    serie, serieId = id,
  } = req.body;

  // file er tómt ef engri var uploadað
  const { file: { path, mimetype } = {} } = req;

  const hasImage = Boolean(path && mimetype);

  const seasons = {
    name, number, airDate, overview, serie, serieId,
  };

  const validations = await validateSeasons(seasons);

  if (hasImage) {
    if (!validateImageMimetype(mimetype)) {
      validations.push({
        field: 'image',
        error: `Mimetype ${mimetype} is not legal. `
        + `Only ${MIMETYPES.join(', ')} are accepted`,
      });
    }
  }

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  // Aðeins ef allt er löglegt uploadum við mynd
  if (hasImage) {
    let upload = null;
    try {
      upload = await cloudinary.uploader.upload(path);
    } catch (error) {
      // Skilum áfram villu frá Cloudinary, ef einhver
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json(
          {
            errors: [{
              field: 'image',
              error: error.message,
            }],
          },
        );
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      seasons.poster = upload.secure_url;
    } else {
      // Einhverja hluta vegna er ekkert `secure_url`?
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const q = `
    INSERT INTO
      seasons
      (name, number, air_date, overview, poster, serie, serie_id)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, air_date, overview, poster, serie, serie_id
`;
  const values = [
    xss(seasons.name),
    xss(seasons.number),
    xss(seasons.airDate),
    (seasons.overview === null) ? seasons.overview : xss(seasons.overview),
    xss(seasons.poster),
    xss(seasons.serie),
    xss(seasons.serieId),
  ];

  const result = await query(q, values);

  return res.status(201).json(result.rows[0]);
}

export async function newSeasons(req, res, next) {
  return withMulter(req, res, next, createSeasonsWithImage);
}
