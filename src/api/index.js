import express from 'express';
import catchErrors from '../utils/catchErrors.js';

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

/*
// Series
router.get('/tv', catchErrors(listSeries));
router.post('/tv', requireAdmin, catchErrors(newSerie));
router.get('/tv/:id', catchErrors(listSerie)); // Mögulega vantar að notandi geti verið loggaður inn
router.patch('/tv/:id', requireAdmin, catchErrors(updateSerie));
router.delete('/tv/:id', requireAdmin, catchErrors(deleteSerie));
router.get('/tv/:id/season', catchErrors(listSeasons));
router.post('/tv/:id/season', requireAdmin, catchErrors(newSeason));
router.get('/tv/:id/season/:id', catchErrors(listSeason));
router.delete('/tv/:id/season/:id', requireAdmin, catchErrors(deleteSeason));
router.post('/tv/:id/season/:id/episode', requireAdmin, catchErrors(newEpisode));
router.get('/tv/:id/season/:id/episode/:id', catchErrors(listEpisode));
router.delete('/tv/:id/season/:id/episode/:id', requireAdmin, catchErrors(deleteEpisode));
router.get('/genres', catchErrors(listGenres));
router.post(/genres', requireAdmin, catchErrors(newGenre));

// Users
router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUser));
router.get('/users/me', requireAuth, catchErrors(currentUser));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));

// Series and users
router.post('/tv/:id/rate', requireAuth, catchErrors(newSeriesRating));
router.patch('/tv/:id/rate', requireAuth, catchErrors(updateSeriesRating));
router.delete('/tv/:id/rate', requireAuth, catchErrors(deleteSeriesRating));
router.post('/tv/:id/state', requireAuth, catchErrors(newSeriesState));
router.patch('/tv/:id/state', requireAuth, catchErrors(updateSeriesState));
router.delete('/tv/:id/state', requireAuth, catchErrors(deleteSeriesState));
router.get('/tv/:id', requireAuth, )
*/
