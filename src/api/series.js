import multer from 'multer';
import cloudinary from 'cloudinary';
import xss from 'xss';
import { isValid } from 'date-fns';
import { query, pagedQuery, conditionalUpdate } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import {
  isInt, isNotEmptyString, isEmpty, lengthValidationError, isBoolean, isString,
} from '../utils/validation.js';

const MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
];

async function findById(id) {
  if (!isInt(id)) {
    return null;
  }

  const series = await query(
    `SELECT
      tvshows.id,tvshows.name,tvshows.air_date,tvshows.inProduction,
      tvshows.tagline,tvshows.image,tvshows.description,tvshows.language,
      tvshows.network,tvshows.homepage, FLOOR(AVG(users_tvshows.rating)) AS averageRating, COUNT(users_tvshows.rating) AS ratingcount
    FROM tvshows
    LEFT JOIN users_tvshows ON tvshows.id = users_tvshows.tvshow_id
    WHERE tvshows.id = $1
    GROUP BY tvshows.id
    `, [id],
  );

  if (series.rows.length !== 1) {
    return null;
  }

  return series.rows[0];
}

async function findSeasons(id) {
  if (!isInt(id)) {
    return null;
  }

  const seasons = await query(
    `SELECT
      name,air_date,overview,poster
    FROM
      seasons
    WHERE serie_id = $1 ORDER BY number `,
    [id],
  );

  return seasons.rows;
}

async function findGenres(id) {
  if (!isInt(id)) {
    return null;
  }

  const genres = await query(
    `SELECT
      genre_name
    FROM
      tvshows_genres
    WHERE tvshow_id=$1 `,
    [id],
  );

  return genres.rows;
}

async function findIfRatingExists(user, id, rating, patching = false) {
  const validations = [];
  if (!isInt(id)) {
    return null;
  }

  const series = await query(
    `SELECT
      rating
    FROM users_tvshows
    INNER JOIN users ON users.id = users_tvshows.user_id
    WHERE users_tvshows.user_id = $1 AND users_tvshows.tvshow_id = $2
    `, [user, id],
  );

  if (series.rows[0] !== undefined) {
    if (series.rows[0].rating) {
      validations.push({
        msg: 'already exists',
        param: 'id',
        location: 'params',
      });
    }
  }

  if (!patching || rating || isEmpty(rating)) {
    if (!isInt(rating) || rating < 0 || rating > 5) {
      validations.push({
        msg: 'rating must be an integer, one of 0, 1, 2, 3, 4, 5',
        param: 'rating',
        location: 'body',
      });
    }
  }

  return validations;
}

async function validateRating(rating, patching = false) {
  const validations = [];

  if (!patching || rating || isEmpty(rating)) {
    if (!isInt(rating) || rating < 0 || rating > 5) {
      validations.push({
        msg: 'rating must be an integer, one of 0, 1, 2, 3, 4, 5',
        param: 'rating',
        location: 'body',
      });
    }
  }

  return validations;
}

async function findIfStateExists(user, id) {
  if (!isInt(id)) {
    return null;
  }

  const series = await query(
    `SELECT
      status, user_id, tvshow_id
    FROM users_tvshows
    INNER JOIN users ON users.id = users_tvshows.user_id
    WHERE users_tvshows.user_id = $1 AND users_tvshows.tvshow_id = $2
    `, [user, id],
  );

  const errors = [];

  if (series.rows[0] !== undefined) {
    if (series.rows[0].status) {
      errors.push({
        msg: 'already exists',
        param: 'state',
        location: 'body',
      });
    }
  }

  return errors;
}

export async function listSeries(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const series = await pagedQuery(
    'SELECT id,name,air_date,inProduction,tagline,image,description,language,network,homepage FROM tvshows ORDER BY id ASC',
    [],
    { offset, limit },
  );

  const seriesWithPage = addPageMetadata(
    series,
    req.path,
    { offset, limit, length: series.items.length },
  );

  return res.json(seriesWithPage);
}

async function validateSeries(
  {
    name, airDate, inProduction, tagline, description, language, network, homepage,
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

  // inProduction validation
  if (!patching || inProduction || isEmpty(inProduction)) {
    if (!inProduction) {
      validation.push({
        msg: 'inProduction is required',
        param: 'inProduction',
        location: 'body',
      });
    }
    let booleanInProduction;
    if (inProduction === 'true') {
      booleanInProduction = true;
    } else if (inProduction === 'false') {
      booleanInProduction = false;
    }
    if (!isBoolean(booleanInProduction)) {
      validation.push({
        msg: 'inProduction must be a boolean',
        param: 'inProduction',
        location: 'body',
      });
    }
  }

  // Tagline validation
  if (!patching || tagline || isEmpty(tagline)) {
    if (tagline !== null && !isString(tagline)) {
      validation.push({
        msg: 'tagline must be a string',
        param: 'tagline',
        location: 'body',
      });
    }
  }

  // Description validation
  if (!patching || description || isEmpty(description)) {
    if (description !== null && !isString(description)) {
      validation.push({
        msg: 'description must be a string',
        param: 'description',
        location: 'body',
      });
    }
  }

  // Language validation
  if (!patching || language || isEmpty(language)) {
    if (!isNotEmptyString(language, { min: 2, max: 2 })) {
      validation.push({
        msg: 'language must be a string of length 2',
        param: 'language',
        location: 'body',
      });
    }
  }

  // Network validation
  if (!patching || network || isEmpty(network)) {
    if (network !== null && !isString(network)) {
      validation.push({
        msg: 'network must be a string',
        param: 'network',
        location: 'body',
      });
    }
  }

  // Homepage validation
  if (!patching || homepage || isEmpty(homepage)) {
    if (homepage !== null && !isString(homepage)) {
      validation.push({
        msg: 'homepage must be a string',
        param: 'homepage',
        location: 'body',
      });
    }
  }

  return validation;
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

async function createSeriesWithImage(req, res, next) {
  const {
    name, airDate, inProduction = null, tagline = null,
    description = null, language, network = null, homepage = null,
  } = req.body;

  // file er t??mt ef engri var uploada??
  const { file: { path, mimetype } = {} } = req;

  const hasImage = Boolean(path && mimetype);

  const series = {
    name, airDate, inProduction, tagline, description, language, network, homepage,
  };

  const validations = await validateSeries(series);

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

  // A??eins ef allt er l??glegt uploadum vi?? mynd
  if (hasImage) {
    let upload = null;
    try {
      upload = await cloudinary.uploader.upload(path);
    } catch (error) {
      // Skilum ??fram villu fr?? Cloudinary, ef einhver
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({
          errors: [{
            field: 'image',
            error: error.message,
          }],
        });
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      series.image = upload.secure_url;
    } else {
      // Einhverja hluta vegna er ekkert `secure_url`?
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const q = `
    INSERT INTO
      tvshows
      (name, air_date, inProduction, tagline, image, description, language, network, homepage)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, name, air_date, inProduction, tagline, image, description, language, network, homepage
  `;
  const values = [
    xss(series.name),
    xss(series.airDate),
    xss(series.inProduction),
    (series.tagline === null) ? series.tagline : xss(series.tagline),
    xss(series.image),
    (series.description === null) ? series.description : xss(series.description),
    xss(series.language),
    (series.network === null) ? series.network : xss(series.network),
    (series.network === null) ? series.homepage : xss(series.network),
  ];

  const result = await query(q, values);

  return res.status(201).json(result.rows[0]);
}

async function updateSeriesWithImage(req, res, next) {
  const { id } = req.params;
  const {
    name, airDate, inProduction, tagline, description,
    language, network, homepage,
  } = req.body;

  // file er t??mt ef engri var uploada??
  const { file: { path, mimetype } = {} } = req;

  const hasImage = Boolean(path && mimetype);

  const series = {
    name,
    airDate,
    inProduction,
    tagline,
    description,
    language,
    network,
    homepage,
  };

  const validations = await validateSeries(series, true, id);

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

  // A??eins ef allt er l??glegt uploadum vi?? mynd
  if (hasImage) {
    let upload = null;
    try {
      upload = await cloudinary.uploader.upload(path);
    } catch (error) {
      // Skilum ??fram villu fr?? Cloudinary, ef einhver
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({
          errors: [{
            field: 'image',
            error: error.message,
          }],
        });
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      series.image = upload.secure_url;
    } else {
      // Einhverja hluta vegna er ekkert `secure_url`?
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const fields = [
    isString(series.name) ? 'name' : null,
    isString(series.airDate) ? 'airDate' : null,
    isString(series.inProduction) ? 'inProduction' : null,
    isString(series.tagline) ? 'tagline' : null,
    isString(series.image) ? 'image' : null,
    isString(series.description) ? 'description' : null,
    isString(series.language) ? 'language' : null,
    isString(series.network) ? 'network' : null,
    isString(series.homepage) ? 'homepage' : null,
  ];

  const values = [
    isString(series.name) ? xss(series.name) : null,
    isString(series.airDate) ? xss(series.airDate) : null,
    isString(series.inProduction) ? xss(series.inProduction) : null,
    isString(series.tagline) ? xss(series.tagline) : null,
    isString(series.image) ? xss(series.image) : null,
    isString(series.description) ? xss(series.description) : null,
    isString(series.language) ? xss(series.language) : null,
    isString(series.network) ? xss(series.network) : null,
    isString(series.homepage) ? xss(series.homepage) : null,
  ];

  if (!fields.filter(Boolean).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  // update updated if updating updates
  fields.push('updated');
  values.push(new Date());

  const result = await conditionalUpdate('tvshows', id, fields, values);

  return res.status(201).json(result.rows[0]);
}

export async function newSeries(req, res, next) {
  return withMulter(req, res, next, createSeriesWithImage);
}

export async function updateSeries(req, res, next) {
  return withMulter(req, res, next, updateSeriesWithImage);
}

export async function deleteSeries(req, res) {
  const { id } = req.params;

  const q = 'DELETE FROM tvshows WHERE id = $1';

  await query(q, [id]);

  return res.json({});
}

export async function newSeriesRating(req, res) {
  const { id } = req.params;
  const user = req.user.id;
  const { rating } = req.body;

  const validations = await findIfRatingExists(user, id, rating);

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  const q = 'INSERT INTO users_tvshows (user_id,tvshow_id,rating) VALUES ($1,$2,$3) RETURNING user_id,rating,tvshow_id';
  const result = await query(q, [xss(user), xss(id), xss(rating)]);
  return res.status(201).json(result.rows[0]);
}

export async function updateSeriesRating(req, res) {
  const { id } = req.params;
  const user = req.user.id;
  const { rating } = req.body;

  const validations = await validateRating(rating);

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  const q = 'UPDATE users_tvshows SET rating = $1 WHERE tvshow_id = $2 AND user_id = $3 RETURNING user_id,rating,tvshow_id';
  const result = await query(q, [rating, xss(id), xss(user)]);
  return res.status(201).json(result.rows[0]);
}

export async function deleteSeriesRating(req, res) {
  const { id } = req.params;
  const user = req.user.id;

  const series = await query(
    `SELECT
      rating, status, user_id, tvshow_id
    FROM users_tvshows
    INNER JOIN users ON users.id = users_tvshows.user_id
    WHERE users_tvshows.user_id = $1 AND users_tvshows.tvshow_id = $2`,
    [user, id],
  );
  if (series.rows.length === 0 || series.rows[0].rating === null) {
    return res.status(400).json({
      errors: [
        {
          msg: 'not found',
          param: 'id',
          location: 'params',
        },
      ],
    });
  }

  const q = 'DELETE FROM users_tvshows WHERE tvshow_id = $1 AND user_id = $2';

  await query(q, [id, user]);

  return res.json({});
}

export async function newSeriesState(req, res) {
  const { id } = req.params;
  const user = req.user.id;
  const { state } = req.body;

  const errors = await findIfStateExists(user, id);

  if (state !== 'Langar a?? horfa' && state !== 'Er a?? horfa' && state !== 'Hef horft') {
    errors.push({
      value: state,
      msg: 'state must be one of "Langar a?? horfa", "Er a?? horfa", "Hef horft"',
      param: 'state',
      location: 'body',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      errors,
    });
  }

  const q = 'INSERT INTO users_tvshows (user_id,tvshow_id,status) VALUES ($1,$2,$3) RETURNING user_id,status,tvshow_id';
  const result = await query(q, [user, id, state]);
  return res.status(201).json(result.rows[0]);
}

export async function updateSeriesState(req, res) {
  const { id } = req.params;
  const user = req.user.id;
  const { status } = req.body;

  const q = 'UPDATE users_tvshows SET status = $1 WHERE tvshow_id = $2 AND user_id = $3 RETURNING user_id,status,tvshow_id';
  const result = await query(q, [xss(status), xss(id), xss(user)]);
  return res.status(201).json(result.rows[0]);
}

export async function deleteSeriesState(req, res) {
  const { id } = req.params;
  const user = req.user.id;

  const series = await query(
    `SELECT
      rating, status, user_id, tvshow_id
    FROM users_tvshows
    INNER JOIN users ON users.id = users_tvshows.user_id
    WHERE users_tvshows.user_id = $1 AND users_tvshows.tvshow_id = $2`,
    [user, id],
  );
  if (series.rows.length === 0 || series.rows[0].status === null) {
    return res.status(400).json({
      errors: [
        {
          msg: 'not found',
          param: 'id',
          location: 'params',
        },
      ],
    });
  }

  const q = 'DELETE FROM users_tvshows WHERE tvshow_id = $1 AND user_id = $2';

  await query(q, [id, user]);

  return res.json({});
}

async function findByIdAuth(id) {
  if (!isInt(id)) {
    return null;
  }

  const series = await query(
    `SELECT
      tvshows.id,tvshows.name,tvshows.air_date,tvshows.inProduction,
      tvshows.tagline,tvshows.image,tvshows.description,tvshows.language,
      tvshows.network,tvshows.homepage, FLOOR(AVG(users_tvshows.rating)) AS averageRating, COUNT(users_tvshows.rating) AS ratingcount, 
      FLOOR(users_tvshows.rating) as rating, users_tvshows.status
    FROM tvshows
    LEFT JOIN users_tvshows ON tvshows.id = users_tvshows.tvshow_id
    WHERE tvshows.id = $1
    GROUP BY tvshows.id, users_tvshows.rating,users_tvshows.status
    `, [id],
  );

  if (series.rows.length < 0) {
    return null;
  }

  return series.rows[0];
}

export async function listSingleSeriesAuth(req, res) {
  const { id } = req.params;

  if (req.user) {
    const singleSeriesAuth = await findByIdAuth(id);
    const seasons = await findSeasons(id);
    const genres = await findGenres(id);

    if (!singleSeriesAuth) {
      return res.status(404).json({ error: 'Series not found' });
    }

    return res.json({
      items: singleSeriesAuth,
      genres,
      seasons,
    });
  }
  const singleSeries = await findById(id);
  const seasons = await findSeasons(id);
  const genres = await findGenres(id);

  if (!singleSeries) {
    return res.status(404).json({ error: 'Series not found' });
  }

  return res.json({
    items: singleSeries,
    genres,
    seasons,
  });
}
