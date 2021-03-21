import { query, pagedQuery } from '../utils/db.js';
import { isInt, isNotEmptyString, lengthValidationError } from '../utils/validation.js';
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

async function validateEpisode(name, number) {
  const validations = [];
  if (!isNotEmptyString(name, { min: 1, max: 256 })) {
    validations.push({
      field: 'name',
      error: lengthValidationError(name, 1, 256),
    });
  }

  if (!isInt(number)) {
    validations.push({
      field: 'number',
      error: 'number must be an integer larger than 0',
    });
  }

  return validations;
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
    const { season_id,serie_id } = req.params;
    const { name,number} = req.body;
  
    const validations = await validateEpisode(name, number);
  
    if (validations.length > 0) {
      return res.status(400).json({
        errors: validations,
      });
    }
  
    const q = 'INSERT INTO episodes (name,number,season_id,serie_id) VALUES ($1,$2,$3,$4) RETURNING id, name, number,season_id,serie_id';
    const result = await query(q, [xss(name),number,season_id,serie_id]);
  
    return res.status(201).json(result.rows[0]);
  }


export async function deleteEpisode(req, res) {
  const { serie_id,season_number, episode_number } = req.params;

  const q = `DELETE FROM episodes WHERE serie_id = $1 AND season = $2 AND number = $3`;

  await query(q, [serie_id,season_number,episode_number]);

  return res.json({});
  
}
