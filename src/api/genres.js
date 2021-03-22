import xss from 'xss';
import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { isNotEmptyString, lengthValidationError, isEmpty } from '../utils/validation.js';

async function validateGenre(name, patching = false) {
  const validation = [];
  if (!patching || name || isEmpty(name)) {
    if (!isNotEmptyString(name, { min: 1, max: 128 })) {
      validation.push({
        msg: `name is required ${lengthValidationError(name, 1, 128)}`,
        param: 'name',
        location: 'body',
      });
    }
  }

  return validation;
}

export async function listGenres(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const genres = await pagedQuery(
    `SELECT
      name
    FROM
      genres `,
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
  const { name } = req.body;

  const validations = await validateGenre(name);

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  const q = 'INSERT INTO genres (name) VALUES ($1) RETURNING name';
  const result = await query(q, [xss(name)]);

  return res.status(201).json(result.rows[0]);
}
