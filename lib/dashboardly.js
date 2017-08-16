const bcrypt = require('bcrypt-as-promised');
const knex = require('knex')({client: 'mysql'});
const validate = require('./validations');
const util = require('./util');

const HASH_ROUNDS = 10;

const USER_FIELDS = ['user_id', 'email', 'username', 'password', 'user_type', 'avatar_url',
    'is_deleted', 'first_name', 'last_name', 'description',
    'created_at', 'updated_at'];

const BOARD_FIELDS = ['id', 'ownerId', 'title', 'description', 'createdAt', 'updatedAt', 'isListed'];
const BOARD_WRITE_FIELDS = ['ownerId', 'title', 'description', 'isListed'];

const BOOKMARKS_FIELDS = ['id', 'boardId', 'title', 'url', 'createdAt', 'updatedAt', 'description'];
const BOOKMARKS_WRITE_FIELDS = ['boardId', 'title', 'url', 'description'];
const BOOKMARKS_UPDATE_FIELDS = ['title', 'url', 'description'];

class DashboardlyDataLoader {
    constructor(conn) {
        this.conn = conn;
    }

    query(sql) {
        return this.conn.query(sql);
    }

    /* Authentication methods *********************************/

    // Create new user
    createUser(userData) {
        // Validate data from userData
        const errors = validate.user(userData);
        if (errors) {
            return Promise.reject({errors: errors});
        }
        // Hash the password
        return bcrypt.hash(userData.password, HASH_ROUNDS)
            .then((hashedPassword) => {
                // Query insertion
                return this.query(
                    knex
                        .insert({
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
                    return result[0];
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
            return Promise.reject({errors: errors});
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


    //NOTIFICATION METHODS
    getAllNotificationForUser(user) {

        return this.query(
            knex
                //.select('*')
                .select(
                    'notifications.notification_id', 'notifications.sender_id', 'notifications.receiver_id',
                    'notifications.object_id', 'notifications.object_type', 'notifications.notification_type',
                    'notifications.message', 'notifications.created_at', 'notifications.updated_at',

                    'users.user_id AS sender_user_id', 'users.email AS sender_email',
                    'users.username  AS sender_username', 'users.user_type  AS sender_type',
                    'users.avatar_url  AS sender_avatar_url', 'users.is_deleted  AS sender_is_deleted',
                    'users.first_name AS sender_first_name', 'users.last_name AS sender_last_name',
                    'users.description AS sender_description', 'users.created_at AS sender_created_at',
                    'users.updated_at  AS sender_updated_at',

                    'payments.payment_id', 'payments.contract_id', 'payments.currency_id',
                    'payments.due_date', 'payments.payment_date', 'payments.payment_amount',
                    'payments.payment_type', 'payments.payment_status', 'payments.is_deleted',
                    'payments.created_at AS payment_created_at', 'payments.updated_at AS payment_created_at',

                    'payment_contracts.contract_id AS payment_contract_id', 'payment_contracts.title AS payment_contract_title',
                    'payment_contracts.payee_id AS payment_contract_payee_id', 'payment_contracts.payer_id AS payment_contract_payer_id',
                    'payment_contracts.parent_id AS payment_contract_parent_id', 'payment_contracts.description AS payment_contract_description',
                    'payment_contracts.total_amount AS payment_contract_total_amount', 'payment_contracts.remaining_amount AS payment_contract_remaining_amount',
                    'payment_contracts.number_of_payments AS payment_contract_number_of_payments',
                    'payment_contracts.payment_frequency AS payment_contract_payment_frequency',
                    'payment_contracts.due_date AS payment_contract_due_date',
                    'payment_contracts.accepted_date AS payment_contract_accepted_date',
                    'payment_contracts.contract_status AS payment_contract_status',
                    'payment_contracts.created_at AS payment_contract_created_at',
                    'payment_contracts.updated_at AS payment_contract_updated_at',

                    'contracts.contract_id', 'contracts.title AS contract_title',
                    'contracts.payee_id AS contract_payee_id', 'contracts.payer_id AS contract_payer_id',
                    'contracts.parent_id AS contract_parent_id', 'contracts.description AS contract_description',
                    'contracts.total_amount AS contract_total_amount',
                    'contracts.remaining_amount AS contract_remaining_amount',
                    'contracts.number_of_payments AS contract_number_of_payments',
                    'contracts.payment_frequency AS contract_payment_frequency',
                    'contracts.due_date AS contract_due_date', 'contracts.accepted_date AS contract_accepted_date',
                    'contracts.contract_status', 'contracts.created_at AS contract_created_at',
                    'contracts.updated_at AS contract_updated_at'
                )
                .from('notifications')
                //.where('receiver_id', user.users_user_id)
                .join('users', function(){
                    this.on('notifications.receiver_id', '=', user.users_user_id)
                        .andOn('notifications.sender_id', '=', 'users.user_id')
                        //.andOn('users.is_deleted', '=', 0)//should we put this in
                })
                .leftJoin('payments', function () {
                    this.on('notifications.object_id', '=', 'payments.payment_id')
                        .andOn('notifications.object_type', '=', knex.raw('?', ['payments']))
                })
                .leftJoin('contracts AS payment_contracts', function () {
                    this.on('payments.contract_id', '=', 'payment_contracts.contract_id')
                        .andOn('notifications.object_type', '=', knex.raw('?', ['payments']))
                })
                .leftJoin('contracts', function () {
                    this.on('notifications.object_id', '=', 'contracts.contract_id')
                        .andOn('notifications.object_type', '=', knex.raw('?', ['contracts']))
                })
                .toString()
            )
            // .then(notificationArray => {
            //     console.log(notificationArray);
            //     return notificationArray.map(notification => {
            //         if (notification.sender_id) {
            //             var senderArray = this.query(
            //                 knex
            //                     .select('*')
            //                     .from('users')
            //                     .where('user_id', notification.sender_id)
            //                     .toString()
            //             );
            //             console.log("My senderArray: ", senderArray);
            //             notification.sender = senderArray[0];
            //             //return notification;
            //         }
            //         else {
            //             notification.sender = {};
            //         }
            //         return notification;
            //     })
            // })
    }

    deleteNotification(notificationId) {
        return this.query(
            knex
                .delete()
                .from('notifications')
                .where('notification_id', notificationId)
                .toString()
        )
            .catch(error => error);

    }
}

module.exports = DashboardlyDataLoader;
