import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';

async function findById(id) {
    if (!isInt(id)) {
      return null;
    }
  
    const seasons = await query(
      `SELECT
        id,name,airDate,description,image
      FROM
        seasons
      WHERE id = $1`,
      [id],
    );
  
    if (seasons.rows.length !== 1) {
      return null;
    }
  
    return seasons.rows[0];
  }

async function deleteRow(id) {
    const q = 'DELETE FROM seasons WHERE id = $1';
  
    return query(q, id);
  }

export async function listSeasons(req, res) {
    const { offset = 0, limit = 10 } = req.query;

    const seasons = await pagedQuery(
        `SELECT
          id, name, number, airdate, description, image
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
    const { id } = req.params;
  
    const season = await findById(id);
  
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
  
    return res.json(season);
  }

export async function newSeason(req, res) {

}

export async function deleteSeason(req, res) {
    const { id } = req.params;

    await deleteRow([id]);

}

export async function newSeriesRating(req, res) {

}

export async function updateSeriesRating(req, res) {

}

export async function deleteSeriesRating(req, res) {

}

export async function newSeriesState(req, res) {

}

export async function newSeriesState(req, res) {

}

export async function deleteSeriesState(req, res) {
    
}
