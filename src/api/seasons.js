import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { isInt } from '../utils/validation.js';

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
      [id,number],
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
      [id,number],
    );
  
    if (episodes.rows.length == 0) {
      return null;
    }
  
    return episodes.rows;
  }

async function deleteRow(id) {
    const q = 'DELETE FROM seasons WHERE id = $1';
  
    return query(q, id);
  }

export async function listSeasons(req, res) {
    const { offset = 0, limit = 10 } = req.query;

    const seasons = await pagedQuery(
        `SELECT
          id, name, number, air_date, overview, poster
        FROM
          seasons
        ORDER BY id`,
        [],
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
    const episodes = await findEpisodes(id,number);
  
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
  
    return res.json({
      season: season,
      episodes: episodes
  });
  }

export async function newSeason(req, res) {

}

export async function deleteSeason(req, res) {
  const { id, number } = req.params;

  const q = 'DELETE FROM seasons WHERE serie_id = $1 AND number = $2';

  await query(q, [id,number]);

  return res.json({});
}
