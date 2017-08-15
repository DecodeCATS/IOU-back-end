const bcrypt = require('bcrypt-as-promised');
const knex = require('knex')({ client: 'mysql' });
const validate = require('./validations');
const util = require('./util');

const HASH_ROUNDS = 10;

const USER_FIELDS = ['user_id', 'email', 'username', 'password', 'user_type', 'avatar_url',
                     'is_deleted', 'first_name', 'last_name', 'description',
                     'created_at', 'updated_at'];

const BOARD_FIELDS = ['id', 'ownerId', 'title', 'description', 'createdAt', 'updatedAt', 'isListed'];
const BOARD_WRITE_FIELDS = ['ownerId', 'title', 'description', 'isListed'];

const BOOKMARKS_FIELDS = ['id', 'boardId', 'title', 'url', 'createdAt', 'updatedAt', 'description'];
const BOOKMARKS_WRITE_FIELDS = ['boardId', 'title', 'url' ,'description'];
const BOOKMARKS_UPDATE_FIELDS = ['title', 'url' ,'description'];

class DashboardlyDataLoader {
  constructor(conn) {
    this.conn = conn;
  }

  query(sql) {
    return this.conn.query(sql);
  }

  /* USER METHODS *********************************/

  // Create new user
  createUser(userData) {
    // Validate data from userData
    const errors = validate.user(userData);
    if (errors) {
      return Promise.reject({ errors: errors });
    }
    // Hash the password
    return bcrypt.hash(userData.password, HASH_ROUNDS)
    .then((hashedPassword) => {
      // Query insertion
      return this.query(
          knex
          .insert( {
              email: userData.email,
              username: userData.username,
              password: hashedPassword,
              avatar_url: userData.avatar_url,
              first_name: userData.first_name,
              last_name: userData.last_name
          })
          .into('users')
          .toString()
      );
    })
    .then((result) => {
      return this.query(
        knex
        .select(USER_FIELDS)
        .from('users')
        .where('user_id', result.insertId)
        .toString()
      );
    })
    .then(result => result[0])
    .catch(error => {
      // Special error handling for duplicate entry
      // console.log("Error =", error.code);
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("Error =", error.code);
        throw new Error('A user with this email already exists');
      } else {
        throw error;
      }
    });
  }

/*  deleteUser(userId) {
    return this.query(
      knex.delete().from('users').where('id', userId).toString()
    );
  }*/

  getUserFromSession(sessionToken) {
    return this.query(
      knex
      .select(util.joinKeys('users', USER_FIELDS))
      .from('sessions')
      .join('users', function () {
        this.on('sessions.user_id', '=', 'users.user_id')
      })
      .where({
        'sessions.token': sessionToken
      })
      .toString()
    )
    .then((result) => {
      if (result.length === 1) {
        //console.log("user=", result[0]);
        return result;
      }
      return null;
    });
  }

  //return the created token when user logs in
  createTokenFromCredentials(email, password) {
    const errors = validate.credentials({
      email: email,
      password: password
    });
    if (errors) {
      return Promise.reject({ errors: errors });
    }

    //available in all .thens
    let sessionToken;
    let user;

    return this.query(
      knex
      .select('user_id', 'password')
      .from('users')
      .where('email', email)
      .toString()
    )
    .then((results) => {
      if (results.length === 1) {
        user = results[0];
        console.log("User from table = ", user);
        return bcrypt.compare(password, user.password)
                      .catch(() => false);
      }
      return false;
    })
    .then((result) => {
      if (result === true) {
        return util.getRandomToken();
      }
      throw new Error('Username or password invalid');
    })
    .then((token) => {
      sessionToken = token;
      console.log("Right before inserting into sessions table");
      return this.query(
        knex
        .insert({
          user_id: user.user_id,
          token: sessionToken,
        })
        .into('sessions')
        .toString()
      );
    })
    .then(() => {
      return sessionToken; //set in above then first line
    });
  }

  logoutUser(token) {
    return this.query(
      knex('sessions')
      .update({
          token: 'expired',
          is_valid: 0,
          logout_time: knex.fn.now()
      })
      .from('sessions')
      .where('token', token)
      .toString()
    )
    .then(() => true);
  }
}

module.exports = DashboardlyDataLoader;
