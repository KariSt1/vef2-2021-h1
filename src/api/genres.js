import { query, pagedQuery } from '../utils/db.js';
import addPageMetadata from '../utils/addPageMetadata.js';

export async function listGenres(req, res) {
    const { offset = 0, limit = 10 } = req.query;

    const genres = await pagedQuery(
        `SELECT
          name
        FROM
          genres
        ORDER BY id`,
        [],
        { offset, limit },
      );

    const genresWithPage = addPageMetadata(
        genres,
        req.path,
        { offset, limit, length: genres.items.length },
      );
    
      return res.json(genresWithPage);
}

export async function newGenre(req, res) {

}
