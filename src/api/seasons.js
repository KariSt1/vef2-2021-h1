import { query, pagedQuery } from '../utils/db.js';
import { isBoolean } from '../utils/validation.js';
import addPageMetadata from '../utils/addPageMetadata.js';

async function findById(id) {
    if (!isInt(id)) {
      return null;
    }
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
        series,
        req.path,
        { offset, limit, length: seasons.items.length },
      );
    
      return res.json(seasonsWithPage);
}

export async function listSeason(req, res) {
    const { id } = req.params;
  
    const season = await findById(id);
  
    if (!season) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    return res.json(season);
  }

export async function newSeason() {

}

export async function deleteSeason() {

}