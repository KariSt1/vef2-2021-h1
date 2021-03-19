
CREATE TABLE tvshows
(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(256) NOT NULL,
  airDate DATE,
  inProduction BOOLEAN,
  tagline VARCHAR(256),
  image VARCHAR(256) NOT NULL, 
  description VARCHAR(256),
  language VARCHAR(256) NOT NULL,
  network VARCHAR(256),
  homepage VARCHAR(256),
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

CREATE TABLE genres
(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(256) NOT NULL ,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);


CREATE TABLE tvshows_genres
(
  tvshow_id INTEGER REFERENCES tvshows(id) NOT NULL,
  genre_id INTEGER REFERENCES genres(id) NOT NULL,
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id),
  CONSTRAINT genre_id FOREIGN KEY (genre_id) REFERENCES genres(id)
);

CREATE TABLE seasons
(
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  nr INTEGER CHECK (nr > 0),
  airDate DATE,
  description VARCHAR(256),
  image VARCHAR(256) DEFAULT NULL, 
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  tvshow_id INTEGER NOT NULL,
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id)
);

CREATE TABLE episodes
(
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  nr INTEGER CHECK (nr > 0),
  airDate DATE,
  description VARCHAR(256),
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  season_id INTEGER NOT NULL,
  CONSTRAINT season_id FOREIGN KEY (season_id) REFERENCES seasons(id)
);

CREATE TABLE users
(
  id SERIAL PRIMARY KEY,
  username VARCHAR(256) NOT NULL UNIQUE,
  email VARCHAR(256) NOT NULL UNIQUE,
  password VARCHAR(128) NOT NULL,
  admin BOOLEAN DEFAULT false,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

-- Tengitafla fyrir notendur og sjónvarpsþætti

CREATE TABLE users_tvshows
(
  user_id INTEGER NOT NULL,
  tvshow_id INTEGER NOT NULL,
  CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id),
  status ENUM ('Langar að horfa', 'Er að horfa', 'Hef horft'),
  rating INTEGER CHECK (rating >= 0 AND rating <= 5)
);


