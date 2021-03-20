
CREATE TABLE tvshows
(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(256) NOT NULL UNIQUE,
  air_date DATE,
  inProduction BOOLEAN,
  tagline VARCHAR(256),
  image VARCHAR(256) NOT NULL, 
  description VARCHAR(1024),
  language VARCHAR(256) NOT NULL,
  network VARCHAR(256),
  homepage VARCHAR(256),
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

CREATE TABLE genres
(
  name VARCHAR(256) NOT NULL PRIMARY KEY,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);


CREATE TABLE tvshows_genres
(
  tvshow_id INTEGER NOT NULL,
  genre_name VARCHAR(256) NOT NULL,
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id),
  CONSTRAINT genre_name FOREIGN KEY (genre_name) REFERENCES genres(name)
);

CREATE TABLE seasons
(
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  number INTEGER CHECK (number > 0),
  air_date DATE,
  overview VARCHAR(2048),
  poster VARCHAR(256) DEFAULT NULL, 
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  serie VARCHAR(256) NOT NULL,
  serie_id INTEGER NOT NULL,
  CONSTRAINT serie FOREIGN KEY (serie) REFERENCES tvshows(name),
  CONSTRAINT serie_id FOREIGN KEY (serie_id) REFERENCES tvshows(id)
);

CREATE TABLE episodes
(
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  number INTEGER CHECK (number > 0),
  air_date DATE,
  overview VARCHAR(256),
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

CREATE TYPE stat AS ENUM ('Langar að horfa', 'Er að horfa', 'Hef horft');

CREATE TABLE users_tvshows
(
  user_id INTEGER NOT NULL,
  tvshow_id INTEGER NOT NULL,
  CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id),
  status stat,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5)
);


