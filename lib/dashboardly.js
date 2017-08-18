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

    // AUTHENTICATION METHODS --------------------------------------------------*

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
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log("Error =", error.code);
                    throw new Error('A user with this email already exists');
                } else {
                    throw error;
                }
            });
    }


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

    // Return the created token when user logs in
    createTokenFromCredentials(email, password) {
        const errors = validate.credentials({
            email: email,
            password: password
        });
        if (errors) {
            return Promise.reject({errors: errors});
        }

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
                return sessionToken; // Set in above then first line
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


    // NOTIFICATION METHODS --------------------------------------------------*

    // Get all notifications for current user
    getAllNotificationsForUser(user) {

        return this.query(
            knex
                .select('notification_id', 'message', 'object_id', 'object_type', 'sender_id')
                .from('notifications')
                .where('receiver_id', user.users_user_id)
                .toString()
        )
            .then(notification => notification)
            .catch(error => error);
    }

    // Delete notification
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


    // NOTIFICATIONS_BLACKLIST METHODS ---------------------------------------*

    // Get blacklisted connections for current user
    getAllBlacklistedPeopleForUser(user) {

        return this.query(
            knex
                .select('users.user_id', 'users.username', 'users.first_name', 'users.last_name', 'users.user_type', 'users.created_at', 'users.updated_at')
                .from('users')
                .join('notifications_blacklist', function () {
                    this.on('users.user_id', '=', 'notifications_blacklist.blacklisted_id')
                })
                .where('notifications_blacklist.list_owner_id', user.users_user_id)
                .orderBy('notifications_blacklist.updated_at')
                .toString()
        )
            .then(blacklist => blacklist)
            .catch(error => error);
    }

    checkBlacklistedConnection(blacklistedUserId, user) {
        const q =
            knex('notifications_blacklist')
                .count('notification_blacklist_id as isBlacklisted')
                .where({
                    'list_owner_id': user.users_user_id,
                    'blacklisted_id': blacklistedUserId
                })
                .toString();

        return this.query(q);
    }

    addConnectionToBlacklist(blacklistedUserId, user) {

        const q =
            knex
                .insert({
                    list_owner_id: user.users_user_id,
                    blacklisted_id: function () {
                        this.select('user2_id')
                            .from('connections')
                            .where({
                                'user1_id': user.users_user_id,
                                'user2_id': blacklistedUserId
                            })
                    }
                })
                .into('notifications_blacklist')
                .toString();

        return this.query(q);
    }

    removeConnectionFromBlacklist(blacklistedUserId, user) {
        const q =
            knex('notifications_blacklist')
                .where({
                    'list_owner_id': user.users_user_id,
                    'blacklisted_id': blacklistedUserId
                })
                .del()
                .toString();

        console.log("The Query is: ", q);
        return this.query(q);
    }


    // CONTRACT METHODS --------------------------------------------------*

    getContractHistoryFromContractId(userId, contractId) {

        // Security: check if current user is either payee or payer
        return this.query(
            knex
                .select('contracts.payee_id', 'contracts.payer_id')
                .from('contracts')
                .where('contracts.contract_id', contractId)
                .toString()
        )
            .then(contract => {

                if (contract[0].payee_id !== userId && contract[0].payer_id !== userId) {
                    throw new Error('You are not allow to review this contract');
                }
                else {

                    // Select the first contract
                    return this.query(
                        knex
                            .select('contract_id', knex.raw('COALESCE(parent_id, contract_id) as parent_id'), 'title',
                                'description', 'total_amount', 'remaining_amount', 'number_of_payments',
                                'payment_frequency', 'due_date', 'accepted_date', 'contract_status',
                                'payee_id', 'payer_id', 'created_at', 'updated_at')
                            .from('contracts')
                            .where('contracts.contract_id', contractId)
                            .toString()
                    )
                        .then(contract => {
                            console.log('MY ORIGINAL CONTRACT: ', contract);

                            var contracts = contract;

                            if (contracts[0].contract_id !== contracts[0].parent_id) {

                                // Select related versions of contract
                                return this.query(
                                    knex
                                        .select('contract_id', 'parent_id', 'title',
                                            'description', 'total_amount', 'remaining_amount', 'number_of_payments',
                                            'payment_frequency', 'due_date', 'accepted_date', 'contract_status',
                                            'payee_id', 'payer_id', 'created_at', 'updated_at')
                                        .from('contracts')
                                        .where('contracts.contract_id', contracts[0].parent_id)
                                        .toString()
                                )
                                    .then(result => {


                                        console.log('MY SECOND ARRAY: ', result);
                                        console.log('FULL HISTORY:', contract.concat(result));
                                        return contracts.concat(result);
                                    })

                            }
                            else {

                                // Select related versions of contract
                                return this.query(
                                    knex
                                        .select('contract_id', 'parent_id', 'title',
                                            'description', 'total_amount', 'remaining_amount', 'number_of_payments',
                                            'payment_frequency', 'due_date', 'accepted_date', 'contract_status',
                                            'payee_id', 'payer_id', 'created_at', 'updated_at')
                                        .from('contracts')
                                        .where('contracts.parent_id', contracts[0].contract_id)
                                        .toString()
                                )
                                    .then(result => {

                                        return contracts.concat(result);
                                    })
                            }
                        })
                }
            })
    }


    getAllActiveContractsOfUser(user) {
        /* Steps
            1.  Get the current user id
            2.  Check if user id = payee_id or payer_id
            3a. Select all the contracts for said user where contract_status = active
            3b. and is_latest =1
        */

        const q =
            knex
                .select('contract_id', 'title', 'description', 'total_amount', 'remaining_amount', 'parent_id',
                    'number_of_payments', 'payment_frequency', 'due_date', 'accepted_date', 'contract_status',
                    'payer_id', 'payee_id', 'created_at', 'updated_at')
                .where(function () {
                    this.where('payer_id', user.users_user_id)
                        .orWhere('payee_id', user.users_user_id)
                })
                .andWhere({
                    contract_status: 'active',
                    is_latest: 1
                })
                .from('contracts')
                .orderBy('updated_at', 'DESC')
                .toString();

        console.log("The query is", q);
        return this.query(q);
    }

    createNewContract(user, contractData) {

        let insertChecker;

        const qr = knex
            .insert({
                title: contractData.title,
                payee_id: contractData.payeeId,
                payer_id: contractData.payerId,
                description: contractData.description,
                total_amount: contractData.totalAmount,
                remaining_amount: contractData.totalAmount,
                number_of_payments: contractData.numberOfPayments,
                payment_frequency: contractData.paymentFrequency,
                due_date: contractData.dueDate,
                contract_status: 'pending'
            })
            .into('contracts')
            .toString();

        console.log('Im inside');

        return this.query(qr)
            .then(result => {

                insertChecker = result; // insertChecker.insertId will have contract_id now

                if(user.users_user_id === contractData.payeeId){
                    // If inside here user is the payee
                    return this.query(
                        knex
                            .insert({
                                sender_id: contractData.payeeId,
                                receiver_id: contractData.payerId,
                                object_id: insertChecker.insertId,
                                object_type: 'contracts',
                                notification_type: 'request',
                                message: user.users_username + ' has sent you a New Contract.'
                            })
                            .into('notifications')
                            .toString()
                    )
                }
                else if(user.users_user_id === contractData.payerId && contractData.payeeId !== null){
                    //if inside here user is the payee
                    return this.query(
                        knex
                            .insert({
                                sender_id: contractData.payerId,
                                receiver_id: contractData.payeeId,
                                object_id: insertChecker.insertId,
                                object_type: 'contracts',
                                notification_type: 'request',
                                message: user.users_username + ' has sent you a New Contract.'
                            })
                            .into('notifications')
                            .toString()
                    )
                }
                else if (user.users_user_id === contractData.payerId && contractData.payeeId === null) {
                    return this.query(
                        knex
                            .select('connections.user2_id', 'users.username',
                                    'notifications_blacklist.list_owner_id',
                                    'notifications_blacklist.blacklisted_id')
                            .from('connections')
                            .join('users', function () {
                                this.on('connections.user2_id', '=', 'users.user_id')
                            })
                            .leftJoin('notifications_blacklist', function () {
                                this.on('connections.user2_id', '=', 'notifications_blacklist.blacklisted_id')
                            })
                            .where({
                                user1_id: user.users_user_id,
                                user_type: 'Person',
                                blacklisted_id: null
                            })
                            .toString()
                    )
                        .then(friends => {
                            console.log('My friends: ', friends);

                            friends.forEach(friend => {

                                return this.query(
                                    knex
                                        .insert({
                                            sender_id: contractData.payerId,
                                            receiver_id: friend.user2_id,
                                            object_id: insertChecker.insertId,
                                            object_type: 'contracts',
                                            notification_type: 'request',
                                            message: user.users_username + ' has sent you a New Contract.'
                                        })
                                        .into('notifications')
                                        .toString()
                                )
                            })
                        })
                }
            })
            .then(notificationResult => {
                console.log('contactId',insertChecker.insertId);
                return this.query(
                    knex
                        .select('*')
                        .from('contracts')
                        .where('contract_id', insertChecker.insertId)
                        .toString()
                )
            })
            .then(contract => contract[0])
            .catch(error => error);

    }

    // CONNECTIONS METHODS --------------------------------------------------*

    // Function returns an array of all connections from user
    getAllConnectionsFromUser(userId) {
        return this.query(
            knex
                .select('users.user_id', 'users.username', 'users.first_name',
                        'users.last_name', 'users.user_type', 'users.created_at',
                        'users.updated_at')
                .from('users')
                .join('connections', function () {
                    this.on('users.user_id', '=', 'connections.user2_id')
                })
                .where('connections.user1_id', userId)
                .toString()
        )
            .then(connections => connections)
            .catch(err => err);
    }

    searchForConnection(userData) {

        return this.query(
            knex
                .select('*')
                .from('users')
                .where('username', 'like', `%${userData.userName}%`)
                .union(function () {
                    this.select('*')
                        .from('users')
                        .where('first_name', 'like', `%${userData.firstName}%`)
                })
                .union(function () {
                    this.select('*')
                        .from('users')
                        .where('last_name', 'like', `%${userData.lastName}%`)
                })
                .union(function () {
                    this.select('*')
                        .from('users')
                        .where('email', 'like', `%${userData.email}%`)
                })
                .toString()
        )
            .then(users => users)
            .catch(err => err);

    }

    requestNewConnection(user, connectionData) {

        return this.query(
            knex
                .insert({
                    sender_id: user.users_user_id,
                    receiver_id: connectionData.userId,
                    object_id: user.users_user_id,
                    object_type: 'users',
                    notification_type: 'request',
                    message: user.users_username + ' has sent a connection request.'
                })
                .into('notifications')
                .toString()
        )
            .then(result => result.insertId)
            .catch(err => err);
    }

    acceptNewConnection(user, connectionData) {

        return this.query(
            knex
                .insert({
                    sender_id: user.users_user_id,
                    receiver_id: connectionData.userId,
                    object_id: user.users_user_id,
                    object_type: 'connections',
                    notification_type: 'request',
                    message: user.users_username + ' has accepted your connection request.'
                })
                .into('notifications')
                .toString()
        )
            .then(result => {

                // Insert two id in array
                var connections = [];
                connections.push({
                    user1_id: user.users_user_id,
                    user2_id: connectionData.userId
                });
                connections.push({
                    user1_id: connectionData.userId,
                    user2_id: user.users_user_id
                });

                // Loop through the array and insert into notifications
                connections.forEach(connection => {

                    return this.query(
                        knex
                            .insert({
                                user1_id: connection.user1_id,
                                user2_id: connection.user2_id
                            })
                            .into('connections')
                            .toString()
                    )
                })
            })
            .then(result => {

                return this.query(
                    knex
                        .select('users.user_id', 'users.username', 'users.first_name',
                            'users.last_name', 'users.user_type', 'users.created_at',
                            'users.updated_at')
                        .from('users')
                        .join('connections', function () {
                            this.on('users.user_id', '=', 'connections.user2_id')
                        })
                        .where('connections.user1_id', user.users_user_id)
                        .toString()
                )
                    .then(connections => connections)
            })
            .catch(err => err);
    }

    deleteConnection(user, connectionData) {

        return this.query(
            knex
                .delete()
                .from('connections')
                .where({
                    user1_id: user.users_user_id,
                    user2_id: connectionData.userId
                })
                .orWhere({
                    user1_id: connectionData.userId,
                    user2_id: user.users_user_id
                })
                .toString()
        )
            .catch(error => error);

    }

}

module.exports = DashboardlyDataLoader;

