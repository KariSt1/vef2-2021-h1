import { query, pagedQuery } from '../utils/db.js';
import { isInt, isNotEmptyString, lengthValidationError, isEmpty,isString } from '../utils/validation.js';
import { isValid } from 'date-fns';
import xss from 'xss';

async function findEpisode(serie_id,season_number,episode_number) {
    if (!isInt(serie_id) && !isInt(season_number) && !isInt(episode_number)) {
      return null;
    }
  
    const episode = await query(
      `SELECT
        id,name,number,air_date,overview,serie_id,season,season_id
      FROM
        episodes
      WHERE serie_id = $1 AND season = $2 AND number = $3`,
      [serie_id,season_number,episode_number],
    );
  
    if (episode.rows.length !== 1) {
      return null;
    }
  
    return episode.rows[0];
  }


async function findSeasonId(season_number) {
  if (!isInt(season_number)) {
    return null;
  }
  
  const season_id = await query(
    `SELECT
      id
    FROM
      seasons
    WHERE number = $1`,
    [season_number],
  );

  
  return season_id.rows[0].id;
}

async function validateEpisode( name, number, air_date,overview,serie_id,
    patching = false,
    id = null,
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

    if (!patching || number || isEmpty(number)) {
      if (!isInt(number)) {
        validation.push({
          msg: `number must be an integer bigger than 0`,
          param: 'number',
          location: 'body',
        });
      }
    }
  
    // airDate validation
    if (!patching || air_date || isEmpty(air_date)) {
      if (air_date !== null && !isValid(new Date(air_date))) {
        validation.push({
          msg: 'air_date must be a date',
          param: 'air_date',
          location: 'body',
        });
      }
    }
  
    // Description validation
    if (!patching || overview || isEmpty(overview)) {
      if (overview !== null && !isString(overview)) {
        validation.push({
          msg: 'overview must be a string',
          param: 'overview',
          location: 'body',
        });
      }
    }

  const episode = await query(
    'SELECT number FROM episodes WHERE number = $1 AND serie_id = $2',
    [number,serie_id],
  );

  if (episode.rows.length > 0) {
    const currentNr = episode.rows[0].number;
    const error = `Episode nr ${currentNr} already exists.`;
    return [{ error }];
  }

  return validation;
}
  

export async function listEpisode(req, res) {
    const { serie_id,season_number, episode_number } = req.params;
  
    const episode = await findEpisode(serie_id,season_number,episode_number);
  
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
  
    return res.json(episode);
}

export async function newEpisode(req, res) {
    const { season_number,serie_id} = req.params;
    const { name,number, air_date=null, overview=null} = req.body;
  
    const season_id = await findSeasonId(season_number);
    const validations = await validateEpisode(name, number, air_date,overview,serie_id);
  
    if (validations.length > 0) {
      return res.status(400).json({
        errors: validations,
      });
    }

    const q = 'INSERT INTO episodes (name,number,air_date,overview,season,season_id,serie_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, number, air_date,overview,season_id,serie_id';
  
    const values = [
      xss(name),
      xss(number),
      (air_date === null) ? air_date : xss(air_date),
      (overview === null) ? overview : xss(overview),
      xss(season_number),
      xss(season_id),
      xss(serie_id),
    ];

    const result = await query(q, values);
    return res.status(201).json(result.rows[0]);
  
  
  }


export async function deleteEpisode(req, res) {
  const { serie_id,season_number, episode_number } = req.params;

  const q = `DELETE FROM episodes WHERE serie_id = $1 AND season = $2 AND number = $3`;

  await query(q, [serie_id,season_number,episode_number]);

  return res.json({});
  
}
