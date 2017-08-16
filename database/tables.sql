DROP DATABASE IF EXISTS iou;

CREATE DATABASE iou;

USE iou;

-- Table users
CREATE TABLE users (

     user_id INT AUTO_INCREMENT,
     email VARCHAR(255) NULL UNIQUE,
     username VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(60) NULL,
     user_type ENUM('Person', 'Organisation', 'Unlisted') DEFAULT 'Person',
     avatar_url VARCHAR(1000),
     is_deleted BOOLEAN NOT NULL DEFAULT 0,
     first_name VARCHAR(255),
     last_name VARCHAR(255),
     description VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

     PRIMARY KEY (user_id)
);

-- Table sessions
CREATE TABLE sessions (

    session_id INT AUTO_INCREMENT NOT NULL,
    user_id INT UNIQUE NOT NULL,
    token VARCHAR(255) NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT 1,
    logout_time TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (session_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- Table connections
CREATE TABLE connections (

    connection_id INT AUTO_INCREMENT NOT NULL,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (connection_id, user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users (user_id),
    FOREIGN KEY (user2_id) REFERENCES users (user_id)
);

-- Table contracts
CREATE TABLE contracts (

    contract_id INT AUTO_INCREMENT NOT NULL,
    title VARCHAR (50) NOT NULL,
    payee_id INT,
    payer_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    total_amount INT NOT NULL,
    remaining_amount INT NOT NULL,
    number_of_payments INT DEFAULT 1,
    payment_frequency ENUM ('one-time', 'daily', 'weekly', 'bi-weekly', 'monthly', 'yearly', 'random') DEFAULT 'one-time',
    due_date TIMESTAMP NULL DEFAULT NULL,
    accepted_date TIMESTAMP NULL DEFAULT NULL,
    contract_status ENUM('pending', 'active', 'completed', 'overdue', 'cancelled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (contract_id),
    FOREIGN KEY (payee_id) REFERENCES users (user_id),
    FOREIGN KEY (payer_id) REFERENCES users (user_id)
);

-- Currency currencies
CREATE TABLE currencies (

    currency_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),
    is_base BOOLEAN NOT NULL DEFAULT 1,
    currency_code VARCHAR(3) NOT NULL,

    PRIMARY KEY (currency_id)
);

-- Table payments
CREATE TABLE payments (

    payment_id INT AUTO_INCREMENT NOT NULL,
    contract_id INT NOT NULL,
    currency_id INT NOT NULL,
    due_date TIMESTAMP NULL DEFAULT NULL,
    payment_date TIMESTAMP NULL DEFAULT NULL,
    payment_amount INT NOT NULL,
    payment_type ENUM('interest', 'payment', 'partial payment'),
    payment_status ENUM('active', 'completed', 'overdue', 'cancelled'),
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (payment_id),
    FOREIGN KEY (contract_id) REFERENCES contracts (contract_id),
    FOREIGN KEY (currency_id) REFERENCES currencies (currency_id)
);

-- Table notifications
CREATE TABLE notifications (

    notification_id INT AUTO_INCREMENT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    object_id INT,
    object_type ENUM('payments', 'contracts', 'notifications', 'currencies', 'users', 'connections'),
    notification_type ENUM('payment', 'alert', 'warning', 'request') NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (notification_id),
    FOREIGN KEY (sender_id) REFERENCES users (user_id),
    FOREIGN KEY (receiver_id) REFERENCES users (user_id)
);

-- Table notifications_blacklist
CREATE TABLE notifications_blacklist (

    notifications_blacklist_id INT AUTO_INCREMENT NOT NULL,
    list_owner_id INT NOT NULL,
    blacklisted_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (notifications_blacklist_id)
);