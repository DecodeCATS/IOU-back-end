DROP DATABASE IF EXISTS iou;

CREATE DATABASE iou;

USE iou;

-- Table users
CREATE TABLE users (

     user_id INT AUTO_INCREMENT,
     email VARCHAR(255) NOT NULL UNIQUE,
     username VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(60) NOT NULL,
     type ENUM('person', 'organisation', 'unlisted')
     avatar_url VARCHAR(1000),
     is_obsolete BOOLEAN NOT NULL DEFAULT 0,
     first_name VARCHAR(255),
     last_name VARCHAR(255),
     description VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

     PRIMARY KEY (id)
);

-- Table sessions
CREATE TABLE sessions (

    session_id INT AUTO_INCREMENT NOT NULL,
    user_id INT UNIQUE NOT NULL,
    token VARCHAR(255) NOT NULL,
    is_valid BOOLEAN SET DEFAULT 1;
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    logout_time TIMESTAMP CURRENT_TIMESTAMP,

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
    FOREIGN KEY (user1_id, user2_id) REFERENCES users (user_id, user_id)
);

-- Table contracts
CREATE TABLE contracts (

    contract_id INT AUTO_INCREMENT NOT NULL,
    connection_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    -- version INT NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    total_amount INT NOT NULL,
    -- remaining_amount INT NOT NULL,
    deadline_date TIMESTAMP,
    accepted_date TIMESTAMP,
    contract_status ENUM('active', 'completed', 'overdue', 'cancelled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (contract_id),
    FOREIGN KEY (parent_id) REFERENCES contracts (parent_id),
    FOREIGN KEY (connection_id) REFERENCES connections (connection_id)
    UNIQUE KEY (parent_id, version),
);

-- Currency currencies
CREATE TABLE currencies (

    currency_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),

    PRIMARY KEY (currency_id)
);

-- Table payments
CREATE TABLE payments (

    payment_id INT AUTO_INCREMENT NOT NULL,
    contract_id INT NOT NULL,
    currency_id INT NOT NULL,
    deadline_date TIMESTAMP,
    payment_date TIMESTAMP,
    payment_amount INT NOT NULL,
    payment_type ENUM('interest', 'payment', 'partial payment'),
    payment_status ENUM('active', 'completed', 'overdue', 'cancelled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (payment_id),
    FOREIGN KEY (contract_id) REFERENCES contracts (contract_id),
    FOREIGN KEY (currency_id) REFERENCES currencies (currency_id)
);




