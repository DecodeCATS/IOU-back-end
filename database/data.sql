USE iou;

-- users
INSERT INTO `users` VALUES (1, 'john@doe.com', 'User1', '$2a$10$ySsfeK9GKC6Cht5lVCilNujKrbRaSFxaYFZZGzBJVlG5vP09REuCC', 'Person', 'https://www.gravatar.com/avatar/8c4114fb407dbb807923e7570a1d6df4?s=60', 0, 'John', 'Doe', NULL, '2017-08-15 13:40:18', '2017-08-15 13:40:18');
INSERT INTO `users` VALUES (2, 'jane@doe.com', 'User2', '$2a$10$kK9/CLhY02G0TKzf.lLbjO0hIpI6LUXXtWaUreYhXU.r31V6w3xuu', 'Person', 'https://www.gravatar.com/avatar/c69d1bbfa2df271297f621962046c4fb?s=60', 0, 'Jane', 'Doe', NULL, '2017-08-15 13:40:32', '2017-08-15 13:40:32');
INSERT INTO `users` VALUES (3, 'bob@rob.com', 'User3', '$2a$10$3yTLP/aNQ3M1kkAAFtSHC.zObcqGKyitckgs4RJf.upNeKM7pxieO', 'Person', 'https://www.gravatar.com/avatar/f6ea598f5f33fa1c92b1314b5c169565?s=60', 0, 'Bob', 'Rob', NULL, '2017-08-15 13:41:08', '2017-08-15 13:41:08');
INSERT INTO `users` VALUES (4, NULL, 'Hydro-Quebec', NULL, 'Organisation', NULL, 0, 'Hydro-Quebec', NULL, 'Electricity company', '2017-08-15 13:46:51', '2017-08-15 13:46:51');
INSERT INTO `users` VALUES (5, 'lisa@simpson.com', 'User5', '$2a$10$fj.NCmWDvGg1NC7OhAesaOXpLF96jG86zs7xpHxRdvQ5FrNZkH5Ye', 'Person', 'https://www.gravatar.com/avatar/d1de4b4e91c859902813da612bbfd7ba?s=60', 0, 'Lisa', 'Simpson', NULL, '2017-08-15 13:48:14', '2017-08-15 13:48:14');
INSERT INTO `users` VALUES (6, NULL, 'Bell', NULL, 'Organisation', NULL, 0, 'Bell Canada', NULL, 'Telecom company', '2017-08-15 13:51:10', '2017-08-15 13:51:10');
INSERT INTO `users` VALUES (7, 'bart@simpson.com', 'User7', '$2a$10$fj.NCmWDvGg1NC7OhAesaOXpLF96jG86zs7xpHxRdvQ5FrNZkH5Ye', 'Person', 'https://www.gravatar.com/avatar/d1de4b4e91c859902813da612bbfd7ba?s=60', 0, 'Bart', 'Simpson', NULL, '2017-08-15 13:48:14', '2017-08-15 13:48:14');



-- notifications_blackilist
INSERT INTO `notifications_blacklist`(notification_blacklist_id, list_owner_id, blacklisted_id) VALUES (1, 1, 7);
INSERT INTO `notifications_blacklist`(notification_blacklist_id, list_owner_id, blacklisted_id) VALUES (2, 7, 1);



-- notifications
INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1000, 2, 1, 101, 'payments', 'payment', 'Payment made');

INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1001, 5, 1, 5, 'connections', 'request', 'Connection Request');

INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1002, 2, 1, 95, 'contracts', 'request', 'New Contract');

INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1003, 7, 1, 95, 'contracts', 'request', 'New Contract');
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
INSERT INTO `connections` (user1_id, user2_id) VALUES (1,7);
INSERT INTO `connections` (user1_id, user2_id, is_blacklisted) VALUES (7,1,1);


-- contracts
INSERT INTO `contracts` VALUES (90, 'Test contract between userId 2 and 1', 2, 1, NULL, NULL, 2000, 1000, 2, 'monthly', NULL, '2017-01-01 00:00:00', 'active', 0, '2017-08-15 14:22:51', '2017-08-15 14:22:51');
INSERT INTO `contracts` VALUES (91, 'Test contract between userId 1 and 3', 1, 3, NULL, NULL, 2000, 1000, 2, 'monthly', NULL, '2017-04-01 00:00:00', 'active', 1, '2017-08-15 14:23:48', '2017-08-15 14:23:48');
INSERT INTO `contracts` VALUES (92, 'Test contract proposal from user3', NULL, 3, NULL, NULL, 10000, 10000, 1, 'one-time', NULL, '2017-08-01 00:00:00', 'pending', 1, '2017-08-15 14:27:51', '2017-08-15 14:27:51');
INSERT INTO `contracts` VALUES (93, 'Test contract with an org', 4, 1, NULL, 'Electric bill', 0, 0, 12, 'monthly', NULL, '2017-08-01 00:00:00', 'active', 1, '2017-08-15 14:28:39', '2017-08-15 14:28:39');
INSERT INTO `contracts` VALUES (94, 'Test contract with an org (Bell)', 6, 1, NULL, 'Internet bill', 12000, 0, 12, 'monthly', NULL, '2017-08-01 00:00:00', 'active', 1, '2017-08-15 14:29:14', '2017-08-15 14:29:14');
INSERT INTO `contracts` VALUES (95, 'Requested contract proposal', 1, 2, NULL, 'As discussed, need 50 bucks for booze', 5000, 0, 1, 'one-time', '2017-10-01 00:00:00', NULL, 'pending', 1, '2017-08-15 14:29:14', '2017-08-15 14:29:14');
INSERT INTO `contracts` VALUES (96, 'Open contract proposal 2', NULL, 5, NULL, NULL, 5000, 0, 1, 'one-time', '2017-11-12 00:00:00', NULL, 'pending', 1, '2017-08-15 14:29:14', '2017-08-15 14:29:14');
INSERT INTO `contracts` VALUES (97, 'Requested contract proposal', 1, 2, NULL, 'As discussed, need 50 bucks for weed', 5000, 0, 1, 'one-time', '2017-10-01 00:00:00', NULL, 'pending', 1, '2017-08-15 14:29:14', '2017-08-15 14:29:14');
INSERT INTO `contracts` VALUES (98, 'Test contract between userId 2 and 1', 2, 1, 90, 'Contract 90, updated description', 2000, 1000, 2, 'monthly', NULL, '2017-01-01 00:00:00', 'active', 1, '2017-08-15 14:22:51', '2017-08-15 14:22:51');
INSERT INTO `contracts` VALUES (99, '1 and 7 have blacklisted each other', 1, 7, NULL, 'Blaclist test', 2000, 2000, 2, 'monthly', NULL, '2017-01-01 00:00:00', 'pending', 1, '2017-08-15 14:22:51', '2017-08-15 14:22:51');

-- 'pending','active','completed','overdue','cancelled', 'declined'
--
-- ('contract_id', 'title', 'parent_id', 'contract_status', 'is_latest', 'accepted_date',)
-- (100, 'Initital Contract', NULL, 'pending', '0', Null)
-- (101, 'Initital Contract Accepted', 100, 'active', '1', Null) --previous becomes 0
-- (102, 'Contract Modification Proposed', 100, 'pending', '1', Null) --previous becomes 0
-- (103, 'Contract Modification Accepted', 100, 'active', '0', Null) --previous becomes 0
-- (103, '2nd Contract Modification Proposed', 100, 'pending', '1', Null) --previous becomes 0
-- (103, '2nd Contract Modification Declined', 100, 'cancelled', '0', Null) --previous becomes 0




-- currencies
INSERT INTO `currencies` VALUES (1, 'Canadian Dollar', '$', 1, 'CAD');
INSERT INTO `currencies` VALUES (2, 'Euro', '€', 1, 'EUR');
INSERT INTO `currencies` VALUES (3, 'Yen', '¥', 1, 'YEN');
INSERT INTO `currencies` VALUES (4, 'Bitcoin', 'B', 1, 'BIT');
INSERT INTO `currencies` VALUES (5, 'Pound', '£', 1, 'GBP');

-- payments
INSERT INTO `payments` VALUES (101, 90, 1, '2017-08-01 00:00:00', '2017-07-31 00:00:00', 1000, 'payment', 'completed', 0, '2017-08-15 14:37:57', '2017-08-15 14:37:57');
INSERT INTO `payments` VALUES (102, 90, 1, '2017-09-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (103, 90, 1, '2017-10-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (104, 90, 1, '2017-11-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (105, 90, 1, '2017-12-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (111, 94, 1, '2017-10-01 00:00:00', NULL, 63376, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (201, 91, 1, '2017-09-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');
INSERT INTO `payments` VALUES (202, 91, 1, '2017-10-01 00:00:00', NULL, 1000, 'payment', 'active', 0, '2017-08-15 14:38:47', '2017-08-15 14:38:47');



-- select `contract_id` as `isChangable` from `contracts` where ((`contract_status` = 'active' or `contract_status` = 'pending') and `payee_id` = 1 and `contract_id` = '93' and `is_latest` = 1) or ((`contract_status` = 'active' or `contract_status` = 'pending') and `payer_id` = 1 and `contract_id` = '93' and `is_latest` = 1)