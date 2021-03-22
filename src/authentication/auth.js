import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Strategy, ExtractJwt } from 'passport-jwt';
import {
  findByUsername, validateUser, comparePasswords,
  findById, createUser,
} from './users.js';

import {
  isNotEmptyString,
  lengthValidationError,
  toPositiveNumberOrDefault,
} from '../utils/validation.js';
import catchErrors from '../utils/catchErrors.js';

dotenv.config();

export const app = express();
app.use(express.json());

const defaultTokenLifetime = 60 * 60;

const {
  JWT_SECRET: jwtSecret,
  JWT_TOKEN_LIFETIME: tokenLifetimeFromEnv,
} = process.env;

const tokenLifetime = toPositiveNumberOrDefault(
  tokenLifetimeFromEnv,
  defaultTokenLifetime,
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

async function strat(data, next) {
  const user = await findById(data.id);

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}

passport.use(new Strategy(jwtOptions, strat));

app.use(passport.initialize());

export function requireAuth(req, res, next) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error = info && info.name === 'TokenExpiredError'
          ? 'expired token' : 'invalid token';

        return res.status(401).json({ error });
      }

      req.user = user;
      return next();
    },
  )(req, res, next);
}

export function optionalAuthentication(req, res, next) {
  return passport.authenticate(
    'jwt',
    { session: false },
    // eslint-disable-next-line no-unused-vars
    (err, user, info) => {
      if (err) {
        next(err);
      }

      if (!user) {
        req.user = null;
        return next();
      }

      req.user = user;
      return next();
    },
  )(req, res, next);
}

export function checkUserIsAdmin(req, res, next) {
  if (req.user && req.user.admin) {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden' });
}

async function registerRoute(req, res) {
  const { username, password, email } = req.body;

  const validationMessage = await validateUser({ username, password, email });

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const result = await createUser(username, password, email);

  delete result.password;

  return res.status(201).json(result);
}

async function loginRoute(req, res) {
  const { username, password } = req.body;

  const validations = [];

  if (!isNotEmptyString(username)) {
    validations.push({
      field: 'username',
      error: `Username is required. ${lengthValidationError(username, 1, 256)}`,
    });
  }

  if (!isNotEmptyString(password, { min: 10 })) {
    validations.push({
      field: 'password',
      error: `Password is required. ${lengthValidationError(password, 10)}`,
    });
  }

  if (validations.length > 0) {
    return res.status(401).json(validations);
  }

  const user = await findByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'No such user' });
  }

  const passwordIsCorrect = await comparePasswords(password, user.password);

  if (passwordIsCorrect) {
    const payload = { id: user.id };
    const tokenOptions = { expiresIn: Number(tokenLifetime) };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);

    delete user.password;

    return res.json({
      user,
      token,
      expiresIn: Number(tokenLifetime),
    });
  }

  return res.status(401).json({ error: 'Invalid password' });
}

app.post('/users/register', catchErrors(registerRoute));
app.post('/users/login', catchErrors(loginRoute));
