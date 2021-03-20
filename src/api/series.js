import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { isInt } from '../utils/validation.js';

async function findById(id) {
  if (!isInt(id)) {
    return null;
  }

  const series = await query(
    `SELECT
      id,name,air_date,inProduction,tagline,image,
      description,language,network,homepage
    FROM
      tvshows
    WHERE id = $1`,
    [id],
  );

  if (series.rows.length !== 1) {
    return null;
  }

  return series.rows[0];
}

export async function listSeries(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const series = await pagedQuery(
    'SELECT id,name,air_date,inProduction,tagline,image,description,language,network,homepage FROM tvshows ORDER BY id ASC',
    [],
    { offset, limit },
  );

  const seriesWithPage = addPageMetadata(
    series,
    req.path,
    { offset, limit, length: series.items.length },
  );

  return res.json(seriesWithPage);
}

export async function newSeries(req, res) {

}

export async function listSingleSeries(req, res) {
  const { id } = req.params;
  
  const singleSeries = await findById(id);

  if (!singleSeries) {
    return res.status(404).json({ error: 'Series not found' });
  }

  return res.json(singleSeries);
}

export async function updateSeries(req, res) {

}

export async function deleteSeries(req, res) {
  const { id } = req.params;

  const q = 'DELETE FROM seasons WHERE id = $1';

  await query(q, [id]);
}