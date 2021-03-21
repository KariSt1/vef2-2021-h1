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
  
    console.log(season_id.rows[0].id);
    return season_id.rows[0].id;
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
    const { season_number,serie_id} = req.params;
    const { name,number, air_date, overview} = req.body;
  
    const season_id = await findSeasonId(season_number);
    const validations = await validateEpisode(name, number);
  
    if (validations.length > 0) {
      return res.status(400).json({
        errors: validations,
      });
    }
    const q = 'INSERT INTO episodes (name,number,season, saeason_id,serie_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, number, air_date,overview,season_id,serie_id';
    const qAir_date = 'INSERT INTO episodes (name,number,air_date,season,season_id,serie_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, number, air_date,overview,season_id,serie_id';
    const qOverview = 'INSERT INTO episodes (name,number,overview,season,season_id,serie_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, number, air_date,overview,season_id,serie_id';
    const qAll= 'INSERT INTO episodes (name,number,air_date,overview,season,season_id,serie_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, number, air_date,overview,season_id,serie_id';
  
    if (air_date === null && overview === null) {
      const result = await query(q, [xss(name),number,season_number,season_id,serie_id]);
      return res.status(201).json(result.rows[0]);
    }

    else if (air_date === null) {
      const result = await query(qOverview, [xss(name),number,overview,season_number,season_id,serie_id]);
      return res.status(201).json(result.rows[0]);
    }

    else if (overview === null) {
      const result = await query(qAir_date, [xss(name),number,air_date,season_number,season_id,serie_id]);
      return res.status(201).json(result.rows[0]);
    }

    else {
        const result = await query(qAll, [xss(name),number,air_date,overview,season_number,season_id,serie_id]);
        return res.status(201).json(result.rows[0]);
    }
  
  }


export async function deleteEpisode(req, res) {
  const { serie_id,season_number, episode_number } = req.params;

  const q = `DELETE FROM episodes WHERE serie_id = $1 AND season = $2 AND number = $3`;

  await query(q, [serie_id,season_number,episode_number]);

  return res.json({});
  
}
