import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';

export async function listSeries(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const series = await pagedQuery(
    'SELECT * FROM tvshows ORDER BY id DESC',
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

async function newSeries(req, res) {

}

async function listSingleSeries(req, res) {

}

async function updateSeries(req, res) {

}

async function deleteSeries(req, res) {

}