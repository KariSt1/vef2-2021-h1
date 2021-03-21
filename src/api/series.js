import { query, pagedQuery } from '../utils/db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { isInt, isNotEmptyString, isEmpty, lengthValidationError } from '../utils/validation.js';

const MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
];

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

async function findSeasons(id) {
  if (!isInt(id)) {
    return null;
  }

  const seasons = await query(
    `SELECT
      name,air_date,overview,poster
    FROM
      seasons
    WHERE serie_id = $1 ORDER BY number `,
    [id],
  );

  return seasons.rows;
}

async function findGenres(id) {
  if (!isInt(id)) {
    return null;
  }

  const genres = await query(
    `SELECT
      genre_name
    FROM
      tvshows_genres
    WHERE tvshow_id=$1 `,
    [id],
  );

  return genres.rows;
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

async function validateSeries(
  { name, airDate, inProduction, tagline, image, description, language, network, url } = {},
  patching = false,
  id = null,
) {
  const validation = [];

  if (!patching || name || isEmpty(name)) {
    if (!isNotEmptyString(name, { min: 1, max: 128 })) {
      validation.push({
        field: 'name',
        error: `name is required ${lengthValidationError(name, 1, 256)}`,
        location: 'body',
      });
    }

    const titleExists = await query(
      'SELECT id FROM products WHERE title = $1',
      [title],
    );

    if (titleExists.rows.length > 0) {
      const current = titleExists.rows[0].id;

      if (patching && id && current === toPositiveNumberOrDefault(id, 0)) {
        // we can patch our own title
      } else {
        const error = `Title already exists in product with id ${current}.`;
        validation.push({
          field: 'title',
          error,
          location: 'body',
        });
      }
    }
  }

  if (!patching || price || isEmpty(price)) {
    if (toPositiveNumberOrDefault(price, 0) <= 0) {
      validation.push({
        field: 'price',
        error: 'Price must be a positive integer',
      });
    } else if (toPositiveNumberOrDefault(price, 0) > 2147483647) {
      validation.push({
        field: 'price',
        error: 'Price can not be higher than 2147483647',
      });
    }
  }

  if (!patching || description || isEmpty(description)) {
    if (!isNotEmptyString(description, { min: 1 })) {
      validation.push({
        field: 'description',
        error: lengthValidationError(description, 1),
      });
    }
  }

  if (!patching || category || isEmpty(category)) {
    let categoryInvalid = false;

    if (toPositiveNumberOrDefault(category, 0) > 2147483647) {
      categoryInvalid = true;
    } else if (toPositiveNumberOrDefault(category, 0) > 0) {
      const cat = await query(
        'SELECT id FROM categories WHERE id = $1',
        [category],
      );

      if (cat.rows.length !== 1) {
        categoryInvalid = true;
      }
    } else {
      categoryInvalid = true;
    }

    if (categoryInvalid) {
      validation.push({
        field: 'category',
        error: 'Category does not exist',
      });
    }
  }

  return validation;
}

function validateImageMimetype(mimetype) {
  return MIMETYPES.indexOf(mimetype.toLowerCase()) >= 0;
}

async function withMulter(req, res, next, fn) {
  multer({ dest: './temp' })
    .single('image')(req, res, (err) => {
      if (err) {
        if (err.message === 'Unexpected field') {
          const errors = [{
            field: 'image',
            error: 'Unable to read image',
          }];
          return res.status(400).json({ errors });
        }

        return next(err);
      }

      return fn(req, res, next).catch(next);
    });
}

/* api */

async function listProducts(req, res) {
  const { offset = 0, limit = 10, search = '', category = '' } = req.query;

  let where = '';
  let values = [];

  const hasSearch = isNotEmptyString(search);
  const hasCategory = isInt(category) && category > 0;

  // Búum til dýnamískt query eftir því hvort search eða category sent inn
  if (hasSearch || hasCategory) {
    const sparam = hasSearch ? '$1' : '';
    const cparam = hasSearch ? '$2' : '$1';

    const parts = [
      hasSearch ?
        `(
          to_tsvector('english', p.title) @@
          plainto_tsquery('english', ${sparam})
          OR
          to_tsvector('english', p.description) @@
          plainto_tsquery('english', ${sparam})
        )` : null,
      hasCategory ?
        `p.category_id = ${cparam}` : null,
    ].filter(Boolean);

    where = `WHERE ${parts.join(' AND ')}`;
    values = [
      hasSearch ? search : null,
      hasCategory ? category : null,
    ].filter(Boolean);
  }

  const q = `
    SELECT
      p.id, p.title, p.price, p.description, p.image, p.created, p.updated,
      p.category_id, c.title as category_title
    FROM
      products AS p
    LEFT JOIN
      categories AS c
    ON
      p.category_id = c.id
    ${where}
    ORDER BY
      p.updated DESC`;

  debug('Products query', q, values);

  const products = await pagedQuery(
    q,
    values,
    { offset, limit },
  );

  const productsWithPage = addPageMetadata(
    products,
    req.path,
    { offset, limit, length: products.items.length },
  );

  return res.json(productsWithPage);
}

async function listProduct(req, res) {
  const { id } = req.params;

  const product = await getProduct(id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
}

async function createProductWithImage(req, res, next) {
  const { title, price, description, category } = req.body;

  // file er tómt ef engri var uploadað
  const { file: { path, mimetype } = {} } = req;

  const hasImage = Boolean(path && mimetype);

  const product = { title, price, description, category };

  const validations = await validateProduct(product);

  if (hasImage) {
    if (!validateImageMimetype(mimetype)) {
      validations.push({
        field: 'image',
        error: `Mimetype ${mimetype} is not legal. ` +
               `Only ${MIMETYPES.join(', ')} are accepted`,
      });
    }
  }

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  // Aðeins ef allt er löglegt uploadum við mynd
  if (hasImage) {
    let upload = null;
    try {
      upload = await cloudinary.uploader.upload(path);
    } catch (error) {
      // Skilum áfram villu frá Cloudinary, ef einhver
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({ errors: [{
          field: 'image',
          error: error.message,
        }] });
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      product.image = upload.secure_url;
    } else {
      // Einhverja hluta vegna er ekkert `secure_url`?
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const q = `
    INSERT INTO
      products
      (title, price, description, category_id, image)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING id, title, price, description, category_id, image
  `;

  const values = [
    xss(product.title),
    xss(product.price),
    xss(product.description),
    xss(product.category),
    xss(product.image),
  ];

  const result = await query(q, values);

  return res.status(201).json(result.rows[0]);
}

async function updateProductWithImage(req, res, next) {
  const { id } = req.params;
  const { title, price, description, category } = req.body;

  // file er tómt ef engri var uploadað
  const { file: { path, mimetype } = {} } = req;

  const hasImage = Boolean(path && mimetype);

  const product = { title, price, description, category };

  const validations = await validateProduct(product, true, id);

  if (hasImage) {
    if (!validateImageMimetype(mimetype)) {
      validations.push({
        field: 'image',
        error: `Mimetype ${mimetype} is not legal. ` +
               `Only ${MIMETYPES.join(', ')} are accepted`,
      });
    }
  }

  if (validations.length > 0) {
    return res.status(400).json({
      errors: validations,
    });
  }

  // Aðeins ef allt er löglegt uploadum við mynd
  if (hasImage) {
    let upload = null;
    try {
      upload = await cloudinary.uploader.upload(path);
    } catch (error) {
      // Skilum áfram villu frá Cloudinary, ef einhver
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({ errors: [{
          field: 'image',
          error: error.message,
        }] });
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      product.image = upload.secure_url;
    } else {
      // Einhverja hluta vegna er ekkert `secure_url`?
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const fields = [
    isString(product.title) ? 'title' : null,
    isString(product.price) ? 'price' : null,
    isString(product.description) ? 'description' : null,
    isString(product.category) ? 'category_id' : null,
    isString(product.image) ? 'image' : null,
  ];

  const values = [
    isString(product.title) ? xss(product.title) : null,
    isString(product.price) ? xss(product.price) : null,
    isString(product.description) ? xss(product.description) : null,
    isString(product.category) ? xss(product.category) : null,
    isString(product.image) ? xss(product.image) : null,
  ];

  if (!fields.filter(Boolean).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  // update updated if updating updates
  fields.push('updated');
  values.push(new Date());

  const result = await conditionalUpdate('products', id, fields, values);

  return res.status(201).json(result.rows[0]);
}

async function createProduct(req, res, next) {
  return withMulter(req, res, next, createProductWithImage);
}

export async function newSeries(req, res) {
  const { name, airDate, genres,
    inProduction, tagline, image,
    description, language, network, homepage
  } = req.body;
  console.log();
  res.json({test: 'wow'});
}

export async function listSingleSeries(req, res) {
  const { id } = req.params;
  
  const singleSeries = await findById(id);
  const seasons = await findSeasons(id);
  const genres = await findGenres(id);

  if (!singleSeries) {
    return res.status(404).json({ error: 'Series not found' });
  }

  return res.json({
    series: singleSeries,
    genres: genres,
    seasons: seasons
});
}

export async function updateSeries(req, res) {

}

export async function deleteSeries(req, res) {
  const { id } = req.params;

  const q = 'DELETE FROM tvshows WHERE id = $1';

  await query(q, [id]);

  return res.json({});
}