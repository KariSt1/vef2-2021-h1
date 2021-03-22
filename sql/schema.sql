
CREATE TABLE tvshows
(
  id SERIAL PRIMARY KEY, 
  name VARCHAR(128) NOT NULL,
  air_date DATE,
  inProduction BOOLEAN,
  tagline VARCHAR(256),
  image VARCHAR(256) NOT NULL, 
  description TEXT,
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
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id) ON DELETE CASCADE,
  CONSTRAINT genre_name FOREIGN KEY (genre_name) REFERENCES genres(name) ON DELETE CASCADE
);

CREATE TABLE seasons
(
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  number INTEGER CHECK (number > 0),
  air_date DATE,
  overview TEXT,
  poster VARCHAR(256) DEFAULT NULL, 
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  serie VARCHAR(256) NOT NULL,
  serie_id INTEGER NOT NULL,
  CONSTRAINT serie_id FOREIGN KEY (serie_id) REFERENCES tvshows(id) ON DELETE CASCADE
);

CREATE TABLE episodes
(
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  number INTEGER CHECK (number > 0),
  air_date DATE,
  overview TEXT,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  season INTEGER CHECK (season > 0),
  season_id INTEGER NOT NULL,
  serie_id INTEGER NOT NULL,
  CONSTRAINT season_id FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  CONSTRAINT serie_id FOREIGN KEY (serie_id) REFERENCES tvshows(id) ON DELETE CASCADE
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
  CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT tvshow_id FOREIGN KEY (tvshow_id) REFERENCES tvshows(id) ON DELETE CASCADE,
  status stat,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

INSERT INTO users (username, email,password,admin) VALUES ('admin','admin@admin.com','$2b$11$vDqeEn8TAMgzLhJatyVipuKrqsYB1bzkEeYnf/xb5ApYlVwJgIrtG','true');
INSERT INTO users (username, email,password,admin) VALUES ('nonni','nonni@hotmail.com','$2b$11$vDqeEn8TAMgzLhJatyVipuKrqsYB1bzkEeYnf/xb5ApYlVwJgIrtG','false');
INSERT INTO users_tvshows (user_id, tvshow_id, status, rating) VALUES (2, 1, 'Langar að horfa', 4);
INSERT INTO users_tvshows (user_id, tvshow_id, status) VALUES (2, 2, 'Er að horfa');
INSERT INTO users_tvshows (user_id, tvshow_id, status, rating) VALUES (2, 3, 'Hef horft', 3);
INSERT INTO users_tvshows (user_id, tvshow_id, rating) VALUES (2, 4, 5);
