import { query, pagedQuery } from '../utils/db.js';
import { isInt } from '../utils/validation.js';

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
  

export async function listEpisode(req, res) {
    const { serie_id,season_number, episode_number } = req.params;
  
    const episode = await findEpisode(serie_id,season_number,episode_number);
  
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
  
    return res.json(episode);
}

export async function newEpisode(req, res) {

}

export async function deleteEpisode(req, res) {
  const { serie_id,season_number, episode_number } = req.params;

  const q = `DELETE FROM episodes WHERE serie_id = $1 AND season = $2 AND number = $3`;

  await query(q, [serie_id,season_number,episode_number]);

  return res.json({});
  
}
