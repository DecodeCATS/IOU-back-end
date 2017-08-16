USE iou;

-- users
INSERT INTO `users` VALUES (1, 'John@Doe.com', 'User1', '$2a$10$ySsfeK9GKC6Cht5lVCilNujKrbRaSFxaYFZZGzBJVlG5vP09REuCC', 'Person', 'https://www.gravatar.com/avatar/8c4114fb407dbb807923e7570a1d6df4?s=60', 0, 'John', 'Doe', NULL, '2017-08-15 13:40:18', '2017-08-15 13:40:18');
INSERT INTO `users` VALUES (2, 'Jane@Doe.com', 'User2', '$2a$10$kK9/CLhY02G0TKzf.lLbjO0hIpI6LUXXtWaUreYhXU.r31V6w3xuu', 'Person', 'https://www.gravatar.com/avatar/c69d1bbfa2df271297f621962046c4fb?s=60', 0, 'Jane', 'Doe', NULL, '2017-08-15 13:40:32', '2017-08-15 13:40:32');
INSERT INTO `users` VALUES (3, 'Bob@Rob.com', 'User3', '$2a$10$3yTLP/aNQ3M1kkAAFtSHC.zObcqGKyitckgs4RJf.upNeKM7pxieO', 'Person', 'https://www.gravatar.com/avatar/f6ea598f5f33fa1c92b1314b5c169565?s=60', 0, 'Bob', 'Rob', NULL, '2017-08-15 13:41:08', '2017-08-15 13:41:08');
INSERT INTO `users` VALUES (4, NULL, 'Hydro-Quebec', NULL, 'Organisation', NULL, 0, 'Hydro-Quebec', NULL, 'Electricity company', '2017-08-15 13:46:51', '2017-08-15 13:46:51');
INSERT INTO `users` VALUES (5, 'Lisa@Simpson.com', 'User5', '$2a$10$fj.NCmWDvGg1NC7OhAesaOXpLF96jG86zs7xpHxRdvQ5FrNZkH5Ye', 'Person', 'https://www.gravatar.com/avatar/d1de4b4e91c859902813da612bbfd7ba?s=60', 0, 'Lisa', 'Simpson', NULL, '2017-08-15 13:48:14', '2017-08-15 13:48:14');
INSERT INTO `users` VALUES (6, NULL, 'Bell', NULL, 'Organisation', NULL, 0, 'Bell Canada', NULL, 'Telecom company', '2017-08-15 13:51:10', '2017-08-15 13:51:10');

-- notifications
INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1000, 2, 1, 101, 'payments', 'payment', 'Payment made');

INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1001, 5, 1, 5, 'connections', 'request', 'Connection Request');

INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1002, 2, 1, 95, 'contracts', 'request', 'New Contract');
-- connections

INSERT INTO `connections` (user1_id, user2_id) VALUES (1,2);
INSERT INTO `connections` (user1_id, user2_id) VALUES (2,1);
INSERT INTO `connections` (user1_id, user2_id) VALUES (1,3);
INSERT INTO `connections` (user1_id, user2_id) VALUES (3,1);
INSERT INTO `connections` (user1_id, user2_id) VALUES (1,4);
INSERT INTO `connections` (user1_id, user2_id) VALUES (4,1);
INSERT INTO `connections` (user1_id, user2_id) VALUES (2,3);
INSERT INTO `connections` (user1_id, user2_id) VALUES (3,2);
INSERT INTO `connections` (user1_id, user2_id) VALUES (2,4);
INSERT INTO `connections` (user1_id, user2_id) VALUES (4,2);
INSERT INTO `connections` (user1_id, user2_id) VALUES (3,4);
INSERT INTO `connections` (user1_id, user2_id) VALUES (4,3);


-- contracts
INSERT INTO `contracts` VALUES (90, 'Test contract between userId 2 and 1', 2, 1, NULL, NULL, 2000, 1000, 2, 'monthly', NULL, '2017-01-01 00:00:00', 'active', '2017-08-15 14:22:51', '2017-08-15 14:22:51');
INSERT INTO `contracts` VALUES (91, 'Test contract between userId 1 and 3', 1, 3, NULL, NULL, 2000, 1000, 2, 'monthly', NULL, '2017-04-01 00:00:00', 'active', '2017-08-15 14:23:48', '2017-08-15 14:23:48');
INSERT INTO `contracts` VALUES (92, 'Test contract proposal from user3', NULL, 3, NULL, NULL, 10000, 10000, 1, 'one-time', NULL, '2017-08-01 00:00:00', 'pending', '2017-08-15 14:27:51', '2017-08-15 14:27:51');
INSERT INTO `contracts` VALUES (93, 'Test contract with an org', 4, 1, NULL, 'Electric bill', 0, 0, 12, 'monthly', NULL, '2017-08-01 00:00:00', 'active', '2017-08-15 14:28:39', '2017-08-15 14:28:39');
INSERT INTO `contracts` VALUES (94, 'Test contract with an org (Bell)', 6, 1, NULL, 'Internet bill', 12000, 0, 12, 'monthly', NULL, '2017-08-01 00:00:00', 'active', '2017-08-15 14:29:14', '2017-08-15 14:29:14');
INSERT INTO `contracts` VALUES (95, 'Requested contract proposal', 1, 2, NULL, 'As discussed, need 50 bucks for booze', 5000, 0, 1, 'one-time', '2017-10-01 00:00:00', NULL, 'pending', '2017-08-15 14:29:14', '2017-08-15 14:29:14');
INSERT INTO `contracts` VALUES (96, 'Open contract proposal 2', NULL, 5, NULL, NULL, 5000, 0, 1, 'one-time', '2017-11-12 00:00:00', NULL, 'pending', '2017-08-15 14:29:14', '2017-08-15 14:29:14');



-- currencies
INSERT INTO `currencies` VALUES (1, 'Canadian Dollar', NULL, 1, 'CAD');

-- payments
INSERT INTO `payments` VALUES (101, 90, 1, '2017-08-01 00:00:00', '2017-07-31 00:00:00', 1000, 'payment', 'completed', 0, '2017-08-15 14:37:57', '2017-08-15 14:37:57');
INSERT INTO `payments` VALUES (102, 90, 1, '2017-09-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (103, 90, 1, '2017-10-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (104, 90, 1, '2017-11-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (105, 90, 1, '2017-12-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (111, 94, 1, '2017-10-01 00:00:00', NULL, 63376, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (201, 91, 1, '2017-09-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (202, 91, 1, '2017-10-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');


-- INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('sadnan@iou.com','ssaquif','abcd123','Sadnan','Saquif');
-- INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('anotonio@iou.com','nebulaUnicornis','abcd123','Antonio','Quintero');
-- INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('chhaya@iou.com','tsirrus','abcd123','Chhaya','Tuok');
-- INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('tetyana@iou.com','tetyanamyronova','abcd123','Tetyana','Myronova');

