USE iou;


INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1000, 2, 1, 101, 'payments', 'payment', 'Payment made');

INSERT INTO notifications(notification_id, sender_id, receiver_id, object_id, object_type,  notification_type, message)
VALUES (1001, 5, 1, 5, 'connections', 'request', 'Connection Request');

INSERT INTO contracts (contract_id, payee_id, payer_id, parent_id, title, description, total_amount, remaining_amount, number_of_payments, payment_frequency, accepted_date, contract_status)
VALUES(90, 2, 1, null, 'Test contract between userId 2 and 1', null, 2000, 1000, 2, 'monthly', '2017-01-01', 'active');

INSERT INTO contracts (contract_id, payee_id, payer_id, parent_id, title, description, total_amount, remaining_amount, number_of_payments, payment_frequency, accepted_date, contract_status) VALUES(91, 1, 3, null, 'Test contract between userId 1 and 3', null, 2000, 1000, 2, 'monthly', '2017-04-01', 'active');
INSERT INTO contracts (contract_id, payee_id, payer_id, parent_id, title, description, total_amount, remaining_amount, number_of_payments, payment_frequency, accepted_date, contract_status) VALUES(92, 3, null, null, 'Test contract proposal from user3', null, 10000, 10000, 1, 'one-time', '2017-08-01', 'pending');

INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('sadnan@iou.com','ssaquif','abcd123','Sadnan','Saquif');
INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('anotonio@iou.com','nebulaUnicornis','abcd123','Antonio','Quintero');
INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('chhaya@iou.com','tsirrus','abcd123','Chhaya','Tuok');
INSERT INTO `users` (email, username, password, first_name, last_name) VALUES ('tetyana@iou.com','tetyanamyronova','abcd123','Tetyana','Myronova');


INSERT INTO `connections` (user1_id, user2_id) VALUES (1,2);
INSERT INTO `connections` (user1_id, user2_id) VALUES (2,1);
INSERT INTO `connections` (user1_id, user2_id) VALUES (3,4);
INSERT INTO `connections` (user1_id, user2_id) VALUES (4,3);





