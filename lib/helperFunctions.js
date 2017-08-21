//const bcrypt = require('bcrypt-as-promised');
const knex = require('knex')({client: 'mysql'});
const validate = require('./validations');




 exports.checkIfUserIsBlacklisted = function checkIfUserIsBlacklisted (userId, friendId) {
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
 };
