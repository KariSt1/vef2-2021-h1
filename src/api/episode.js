/* eslint-disable import/no-unresolved */
import { isValid } from 'date-fns';
import xss from 'xss';
import { query } from '../utils/db.js';
import {
  isInt, isNotEmptyString, lengthValidationError, isEmpty, isString,
}
  from '../utils/validation.js';

async function findEpisode(serieId, seasonNumber, episodeNumber) {
  if (!isInt(serieId) && !isInt(seasonNumber) && !isInt(episodeNumber)) {
    return null;
  }

  const episode = await query(
    `SELECT
        id,name,number,air_date,overview,serie_id,season,season_id
      FROM
        episodes
      WHERE serie_id = $1 AND season = $2 AND number = $3`,
    [serieId, seasonNumber, episodeNumber],
  );

  if (episode.rows.length !== 1) {
    return null;
  }

  return episode.rows[0];
}

async function findSeasonId(seasonNumber) {
  if (!isInt(seasonNumber)) {
    return null;
  }

  const seasonId = await query(
    `SELECT
      id
    FROM
      seasons
    WHERE number = $1`,
    [seasonNumber],
  );

  return seasonId.rows[0].id;
}

async function validateEpisode(name, number, airDate, overview, serieId,
  patching = false) {
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
        msg: 'number must be an integer bigger than 0',
        param: 'number',
        location: 'body',
      });
    }
  }

  // airDate validation
  if (!patching || airDate || isEmpty(airDate)) {
    if (airDate !== null && !isValid(new Date(airDate))) {
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
    [number, serieId],
  );

  if (episode.rows.length > 0) {
    const currentNr = episode.rows[0].number;
    const error = `Episode nr ${currentNr} already exists.`;
    return [{ error }];
  }

  return validation;
}

export async function listEpisode(req, res) {
  const { serieId, seasonNumber, episodeNumber } = req.params;

  const episode = await findEpisode(serieId, seasonNumber, episodeNumber);

  if (!episode) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  return res.json(episode);
}

export async function newEpisode(req, res) {
  const { seasonNumber, serieId } = req.params;
  const {
    name, number, airDate = null, overview = null,
  } = req.body;

  const seasonId = await findSeasonId(seasonNumber);
  const validations = await validateEpisode(name, number, airDate, overview, serieId);

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  const q = 'INSERT INTO episodes (name,number,air_date,overview,season,season_id,serie_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, number, air_date,overview,season_id,serie_id';

  const values = [
    xss(name),
    xss(number),
    (airDate === null) ? airDate : xss(airDate),
    (overview === null) ? overview : xss(overview),
    xss(seasonNumber),
    xss(seasonId),
    xss(serieId),
  ];

  const result = await query(q, values);
  return res.status(201).json(result.rows[0]);
}

export async function deleteEpisode(req, res) {
  const { serieId, seasonNumber, episodeNumber } = req.params;

  const q = 'DELETE FROM episodes WHERE serie_id = $1 AND season = $2 AND number = $3';

  await query(q, [serieId, seasonNumber, episodeNumber]);

  return res.json({});
}
