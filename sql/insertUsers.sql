INSERT INTO users (username, email,password,admin) VALUES ('admin','admin@admin.com','$2b$11$vDqeEn8TAMgzLhJatyVipuKrqsYB1bzkEeYnf/xb5ApYlVwJgIrtG','true');
INSERT INTO users (username, email,password,admin) VALUES ('nonni','nonni@hotmail.com','$2b$11$vDqeEn8TAMgzLhJatyVipuKrqsYB1bzkEeYnf/xb5ApYlVwJgIrtG','false');
INSERT INTO users_tvshows (user_id, tvshow_id, status, rating) VALUES (2, 1, 'Langar að horfa', 4);
INSERT INTO users_tvshows (user_id, tvshow_id, status) VALUES (2, 2, 'Er að horfa');
INSERT INTO users_tvshows (user_id, tvshow_id, status, rating) VALUES (2, 3, 'Hef horft', 3);
INSERT INTO users_tvshows (user_id, tvshow_id, rating) VALUES (2, 4, 5);
