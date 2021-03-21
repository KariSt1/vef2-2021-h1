import bcrypt from 'bcrypt';
import xss from 'xss';

import {
  isInt,
  isEmpty,
  isNotEmptyString,
  isString,
  toPositiveNumberOrDefault,
  lengthValidationError,
} from '../utils/validation.js';
import { query, conditionalUpdate } from'../utils/db.js';

const {
  BCRYPT_ROUNDS: bcryptRounds = 11,
} = process.env;

export async function findByUsername(username) {
  const q = `
    SELECT
      id, username, password, email, admin
    FROM
      users
    WHERE username = $1`;

  const result = await query(q, [username]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

async function findByEmail(email) {
  const q = `
    SELECT
      id, username, password, email, admin
    FROM
      users
    WHERE email = $1`;

  const result = await query(q, [email]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

export async function validateUser(
  { username, password, email } = {},
  patching = false,
  id = null,
) {
  const validations = [];

  // can't patch username
  if (!patching) {
    if (!isNotEmptyString(username, { min: 3, max: 32 })) {
      validations.push({
        msg: 'username is required, ' + lengthValidationError(username, 3, 32),
        param: 'username',
        location: 'body',
      });
    }

    const user = await findByUsername(username);

    if (user) {
      validations.push({
        field: 'username',
        error: 'Username exists',
      });
    }
  }
  
  if (!patching || email || isEmpty(email)) {
    if (!isNotEmptyString(email, { min: 1, max: 64 })) {
      validations.push({
        field: 'email',
        error: lengthValidationError(email,1, 64),
      });
    }

    const user = await findByEmail(email);

    if (user) {
      const current = user.id;

      if (patching && id && current === toPositiveNumberOrDefault(id, 0)) {
        // we can patch our own email
      } else {
        validations.push({
          field: 'email',
          error: 'Email exists',
        });
      }
    }
  }

  if (!patching || password || isEmpty(password)) {
    if (!isNotEmptyString(password, { min: 10 })) {
      validations.push({
        field: 'password',
        error: lengthValidationError(password, 10),
      });
    }
  }

  return validations;
}

export async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);

  return result;
}

export async function findById(id) {
  if (!isInt(id)) {
    return null;
  }

  const user = await query(
    `SELECT
      id, username, email, admin, created, updated
    FROM
      users
    WHERE id = $1`,
    [id],
  );

  if (user.rows.length !== 1) {
    return null;
  }

  return user.rows[0];
}

export async function createUser(username, password, email, admin = false) {
  const hashedPassword = await bcrypt.hash(password, bcryptRounds);

  const q = `
    INSERT INTO
      users (username, email, password, admin)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *`;

  const values = [xss(username), xss(email), hashedPassword, admin];
  const result = await query(
    q,
    values,
  );

  return result.rows[0];
}

export async function updateUser(id, password, email) {
  if (!isInt(id)) {
    return null;
  }

  const fields = [
    isString(password) ? 'password' : null,
    isString(email) ? 'email' : null,
  ];

  let hashedPassword = null;

  if (password) {
    hashedPassword = await bcrypt.hash(password, bcryptRounds);
  }

  const values = [
    hashedPassword,
    isString(email) ? xss(email) : null,
  ];

  fields.push('updated');
  values.push(new Date());

  const result = await conditionalUpdate('users', id, fields, values);

  if (!result) {
    return null;
  }

  const updatedUser = result.rows[0];
  delete updatedUser.password;

  return updatedUser;
}