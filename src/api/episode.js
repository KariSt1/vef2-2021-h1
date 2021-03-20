import { query, pagedQuery } from '../utils/db.js';
import { isInt } from '../utils/validation.js';

async function findById(id) {
    if (!isInt(id)) {
      return null;
    }
  
    const episode = await query(
      `SELECT
        id,name,number,airDate,description,season_id
      FROM
        episodes
      WHERE id = $1`,
      [id],
    );
  
    if (episode.rows.length !== 1) {
      return null;
    }
  
    return episode.rows[0];
  }
  

export async function listEpisode(req, res) {
    const { id } = req.params;
  
    const episode = await findById(id);
  
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
  
    return res.json(episode);
}

export async function newEpisode(req, res) {

}

export async function deleteEpisode(req, res) {

}
