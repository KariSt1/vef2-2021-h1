import { query, pagedQuery } from '../utils/db.js';

async function listSeries(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const categories = await pagedQuery(
    'SELECT id, title FROM series ORDER BY updated DESC',
    [],
    { offset, limit },
  );

  const categoriesWithPage = addPageMetadata(
    categories,
    req.path,
    { offset, limit, length: categories.items.length },
  );

  return res.json(categoriesWithPage);
}

async function newSeries(req, res) {

}

async function listSingleSeries(req, res) {

}

async function updateSeries(req, res) {

}

async function deleteSeries(req, res) {

}