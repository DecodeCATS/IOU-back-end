USE iou;

INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('sadnan@iou.com','ssaquif','abcd123','Sadnan','Saquif');
INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('anotonio@iou.com','nebulaUnicornis','abcd123','Antonio','Quintero');
INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('chhaya@iou.com','tsirrus','abcd123','Chhaya','Tuok');
INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('tetyana@iou.com','tetyanamyronova','abcd123','Tetyana','Myronova');


INSERT INTO `connections` (user1_id, user2_id) VALUES (1,2);
INSERT INTO `connections` (user1_id, user2_id) VALUES (2,1);
INSERT INTO `connections` (user1_id, user2_id) VALUES (3,4);
INSERT INTO `connections` (user1_id, user2_id) VALUES (4,3);





