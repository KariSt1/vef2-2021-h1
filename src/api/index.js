import express from 'express';
import { listSeason, listSeasons, deleteSeason, newSeasons } from './seasons.js';
import { listEpisode, deleteEpisode, newEpisode } from './episode.js';
import {
  listSeries,
  listSingleSeries,
  newSeries,
  deleteSeries,
  updateSeries,
  newSeriesRating,
  updateSeriesRating,
  deleteSeriesRating,
  updateSeriesState,
  newSeriesState,
} from './series.js';
import { listGenres, newGenre } from './genres.js';
import {
  listUsers,
  listUser,
  updateUserRoute as updateUser,
  currentUser,
  updateCurrentUser,
} from './users.js';
import { requireAuth, checkUserIsAdmin } from '../authentication/auth.js';
import catchErrors from '../utils/catchErrors.js';

const requireAdmin = [
  requireAuth,
  checkUserIsAdmin,
];

export const router = express.Router();

function indexRoute(req, res) {
  return res.json({
    tv: {
      series: {
        href: '/tv',
        methods: [
          'GET',
          'POST',
        ],
      },
      serie: {
        href: '/tv/{id}',
        methods: [
          'GET',
          'PATCH',
          'DELETE',
        ],
      },
      rate: {
        href: '/tv/{id}/rate',
        methods: [
          'POST',
          'PATCH',
          'DELETE',
        ],
      },
      state: {
        href: '/tv/{id}/state',
        methods: [
          'POST',
          'PATCH',
          'DELETE',
        ],
      },
    },
    seasons: {
      seasons: {
        href: '/tv/{id}/season',
        methods: [
          'GET',
          'POST',
        ],
      },
      season: {
        href: '/tv/{id}/season/{season}',
        methods: [
          'GET',
          'DELETE',
        ],
      },
    },
    episodes: {
      episodes: {
        href: '/tv/{id}/season/{season}/episode',
        methods: [
          'POST',
        ],
      },
      episode: {
        href: '/tv/{id}/season/{season}/episode/{episode}',
        methods: [
          'GET',
          'DELETE',
        ],
      },
    },
    genres: {
      genres: {
        href: '/genres',
        methods: [
          'GET',
          'POST',
        ],
      },
    },
    users: {
      users: {
        href: '/users',
        methods: [
          'GET',
        ],
      },
      user: {
        href: '/users/{id}',
        methods: [
          'GET',
          'PATCH',
        ],
      },
      register: {
        href: '/users/register',
        methods: [
          'POST',
        ],
      },
      login: {
        href: '/users/login',
        methods: [
          'POST',
        ],
      },
      me: {
        href: '/users/me',
        methods: [
          'GET',
          'PATCH',
        ],
      },
    },
  });
}

router.get('/', indexRoute);

router.get('/users/me', requireAuth, catchErrors(currentUser));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));
router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUser));

// Series
router.get('/tv', catchErrors(listSeries));
router.post('/tv', requireAdmin, catchErrors(newSeries));
router.patch('/tv/:id', requireAdmin, catchErrors(updateSeries));
router.get('/tv/:id', catchErrors(listSingleSeries));
router.delete('/tv/:id', requireAdmin, catchErrors(deleteSeries));

router.get('/tv/:id/season', catchErrors(listSeasons));
router.get('/tv/:id/season/:number', catchErrors(listSeason));
router.delete('/tv/:id/season/:number', requireAdmin, catchErrors(deleteSeason));
router.post('/tv/:id/season', requireAdmin, catchErrors(newSeasons));

router.get('/tv/:serie_id/season/:season_number/episode/:episode_number', catchErrors(listEpisode));
router.delete('/tv/:serie_id/season/:season_number/episode/:episode_number', requireAdmin, catchErrors(deleteEpisode));
router.post('/tv/:serie_id/season/:season_number/episode', requireAdmin, catchErrors(newEpisode));

router.get('/genres', catchErrors(listGenres));
router.post('/genres', requireAdmin, catchErrors(newGenre));

router.post('/tv/:id/rate', requireAuth, catchErrors(newSeriesRating));
router.patch('/tv/:id/rate', requireAuth, catchErrors(updateSeriesRating));
router.post('/tv/:id/state', requireAuth, catchErrors(newSeriesState));

router.delete('/tv/:id/rate', requireAuth, catchErrors(deleteSeriesRating));
router.patch('/tv/:id/state', requireAuth, catchErrors(updateSeriesState));


/*
// Series


// Series and users

router.delete('/tv/:id/state', requireAuth, catchErrors(deleteSeriesState));
router.get('/tv/:id', requireAuth, )
*/
