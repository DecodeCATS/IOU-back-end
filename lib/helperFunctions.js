const bcrypt = require('bcrypt-as-promised');
const knex = require('knex')({client: 'mysql'});
const validate = require('./validations');
const util = require('./util');


const HASH_ROUNDS = 10;

const USER_FIELDS = ['user_id', 'email', 'username', 'password', 'user_type', 'avatar_url',
    'is_deleted', 'first_name', 'last_name', 'description',
    'created_at', 'updated_at'];


class helperFunctions {
    constructor(conn) {
        this.conn = conn;
        //this.checkIfUserIsBlacklisted = this.checkIfUserIsBlacklisted.bind(this);
    }

    query(sql) {
        return this.conn.query(sql);
    }

    checkIfUserIsBlacklisted (userId, friendId) {
        //returns 1 if user has been blacklisted by friend else returns 0
        qry = knex('connections')
            .count('is_blacklisted as isBlacklisted')
            .where({
                user1_id: friendId,
                user2_id: userId,
                is_blacklisted: 1
            })
            .toString()
        console.log("Checking if blacklisted query =", qry);
        return this.query(qry);
    }
}

module.exports = helperFunctions;