const bcrypt = require('bcrypt-as-promised');
const knex = require('knex')({client: 'mysql'});
const validate = require('./validations');
const util = require('./util');
const helperFunctions = require('./helperFunctions');


const HASH_ROUNDS = 10;

const USER_FIELDS = ['user_id', 'email', 'username', 'password', 'user_type', 'avatar_url',
    'is_deleted', 'first_name', 'last_name', 'description',
    'created_at', 'updated_at'];


class DashboardlyDataLoader {
    constructor(conn) {
        this.conn = conn;
        this.checkIfUserIsBlacklisted = this.checkIfUserIsBlacklisted.bind(this);
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

        let newToken;
        let user;
        let isValidUser;
        let session;
        //let userIdTable;

        return this.query(
            knex
                .select('user_id', 'password')
                .from('users')
                .where('email', email)
                .toString()
        )
            .then((results) => {
                //if user exists then check password
                if (results.length === 1) {
                    user = results[0];
                    console.log("User from table = ", user);
                    return bcrypt.compare(password, user.password)
                        .catch(() => false);
                }
                return false;
            })
            .then(result => {
                isValidUser = result;
                const qry2 =
                    knex
                        .select('session_id', 'user_id', 'token')
                        .from('sessions')
                        .where('user_id', user.user_id)
                        .toString();
                console.log("The login token", qry2);
                return this.query(qry2)
            })
            .then((result) => {
                //if password matches get a random token
                session = result[0];
                console.log("session=",session);
                if (/*result*/isValidUser === true) {
                    return util.getRandomToken();
                }
                throw new Error('Username or password invalid');
            })
            .then((token) => {
                newToken = token;
                //console.log("Right before inserting into sessions table");
                let qry3;
                if(session !== undefined)
                {
                     qry3 =
                        knex('sessions')
                            .update({
                                user_id: user.user_id,
                                token: newToken,
                            })
                            .where('session_id', session.session_id)
                            .toString();
                }
                else{
                    qry3 =
                        knex('sessions')
                            .insert({
                                user_id: user.user_id,
                                token: newToken,
                            })
                            .toString();
                }

                return this.query(qry3)
            })
            .then(() => {
                return newToken; // Set in above then first line
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
                .select('notification_id', 'message', 'object_id',
                    'object_type', 'sender_id', 'created_at', 'updated_at')
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


    checkIfUserIsBlacklisted(userId, friendId) {
        //returns 1 if user has been blacklisted by friend else returns 0
        const qry = knex('connections')
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
                console.log(contract, "contract object from database")
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

    getAllProposedContractsOfUser(user) {
        console.log("Inside here")
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
                    contract_status: 'pending',
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

        return Promise.all([this.query(qr), this.checkIfUserIsBlacklisted(user.users_user_id, contractData.payerId),
            this.checkIfUserIsBlacklisted(user.users_user_id, contractData.payeeId)])

            .then(result => {

                insertChecker = result[0]
                console.log('My 1 promise: ', result[0]);
                console.log('My 2 promise: ', result[1][0].isBlacklisted);
                console.log('My 3 promise: ', result[2][0].isBlacklisted);

                let is_blacklisted;

                if (user.users_user_id === contractData.payeeId) {
                    // If inside here user is the payee
                    is_blacklisted = result[1][0].isBlacklisted;

                    if (is_blacklisted === 0) {
                        console.log("here")
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
                        );
                    }
                }

                else if (user.users_user_id === contractData.payerId && contractData.payeeId !== null) {
                    //if inside here user is the payer and it is NOT an OPEN CONTRACT
                    is_blacklisted = result[2][0].isBlacklisted;
                    if (is_blacklisted === 0) {
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
                }
                else if (user.users_user_id === contractData.payerId && contractData.payeeId === null) {
                    return this.query(
                        knex
                            .select('connections.user1_id', 'connections.is_blacklisted','users.username')
                            .from('connections')
                            .join('users', function () {
                                this.on('connections.user2_id', '=', 'users.user_id')
                            })
                            // .leftJoin('notifications_blacklist', function () {
                            //     this.on('connections.user2_id', '=', 'notifications_blacklist.blacklisted_id')
                            // })
                            .where({
                                user_type: 'Person',
                                is_blacklisted: 0 //this is important see the raw version of this query using console.log
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
                console.log('contactId', insertChecker.insertId);
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


    //check if contract can be cancelled by the current user
    checkIfContractIsCancelable(user, contractId) {
        //console.log('The payee_id', user.users_user_id)
        const qry =
            knex
                .count('contract_id as isCancelable')
                .from('contracts')
                .where({
                    payee_id: user.users_user_id, //I am the payee so I can never be a organisation (In case of regular user)
                    contract_id: contractId,
                    is_latest: 1,
                    contract_status: 'active'
                    //contract_status: 'cancelled'
                })
                .toString();
        //console.log(qry);
        return this.query(qry);
    }


    //Cancel an Active contract
    cancelActiveContract(user, contractId) {
        //console.log("user is=", user);
        const qry =
            knex('contracts')
                .where({
                    contract_id: contractId
                })
                .update({
                    contract_status: 'cancelled'
                    //contract_status: 'active'
                })
                .toString();
        //update the contract to cancelled with above query
        return this.query(qry)
            .then(result => {
                //get the payer_id of the updated contract to send notification
                const qry2 =
                    knex
                        .select('contract_id', 'payee_id', 'payer_id', 'list_owner_id', 'blacklisted_id')
                        .from('contracts')
                        .leftJoin('notifications_blacklist', function () {
                            this.on('contracts.payer_id', '=', 'notifications_blacklist.blacklisted_id')
                        })
                        .where({
                            contract_id: contractId,
                            blacklisted_id: null
                        })
                        .toString();
                console.log("qr2 is", qry2); //see this on console. Very Good query
                return this.query(qry2);
            })
            .then(result => {
                console.log("Result from contract select= ", result)
                if (result.length) {
                    const qry3 =
                        knex
                            .insert({
                                sender_id: result[0].payee_id,
                                receiver_id: result[0].payer_id,
                                object_id: result[0].contract_id,
                                object_type: 'contracts',
                                notification_type: 'alert',
                                message: ' has cancelled a Contract with you.'
                            })
                            .into('notifications')
                            .toString();
                    console.log("qr3 is", qry3);
                    return this.query(qry3);
                }
                return 0;
            })
    }


    //check is contract can be updated by current owner
    checkIfContractIsChangeable(user, contractId) {
        //console.log('The payee_id', user.users_user_id)
        const qry =
            knex
                .count('contract_id as isChangable')
                .from('contracts')
                .where(function () {
                    this.where(function () {
                        this.where('contract_status', 'active')
                            .orWhere('contract_status', 'pending')
                    })
                        .andWhere(function () {
                            this.where('contract_id', contractId)
                                .orWhere('parent_id', contractId)
                        })
                        .andWhere(function () {
                            this.where('payee_id', user.users_user_id)
                                .orWhere('payer_id', user.users_user_id)
                        })
                        .andWhere({
                            is_latest: 1
                        })
                })
                .toString();
        console.log("The is Changable query=", qry);
        return this.query(qry);
    }

    //Modify an existing contract of the payee
    modifyActiveContract(user, modifiedContractData, contractId) {

        let newContractId; //will be used to store the contract id

        const qry1 =
            knex
            //Get Everything that wont be changed, Need to update Apiary
                .select('contract_id', 'parent_id', 'payee_id', 'payer_id')
                .from('contracts')
                .where({
                    contract_id: contractId
                })
                .toString();

        console.log("The qry1 is", qry1);
        return this.query(qry1)
            .then(oldContract => {
                //Step 2: Create the new contract version

                if (!oldContract[0].parent_id) {
                    console.log("Current parentId= ", oldContract[0].parent_id);
                    console.log("Current contractId= ", oldContract[0].contract_id);
                    oldContract[0].parent_id = oldContract[0].contract_id;
                    console.log("New parentId= ", oldContract[0].parent_id)
                }

                console.log("Old contract payeeId= ", oldContract[0].payee_id)
                console.log("Old contract payerId= ", oldContract[0].payer_id)

                const qry2 =
                    knex
                        .insert({
                            title: modifiedContractData.title,
                            payee_id: oldContract[0].payee_id,
                            payer_id: oldContract[0].payer_id,
                            parent_id: oldContract[0].parent_id,
                            description: modifiedContractData.description,
                            total_amount: modifiedContractData.totalAmount,
                            remaining_amount: modifiedContractData.remainingAmount,
                            number_of_payments: modifiedContractData.numberOfPayments,
                            payment_frequency: modifiedContractData.paymentFrequency,
                            due_date: modifiedContractData.dueDate,
                            contract_status: 'pending',
                            is_latest: 1
                        })
                        .into('contracts')
                        .toString();

                console.log("qr2=", qry2);
                return this.query(qry2);
            })
            .then(insertResult => {
                //Step 3: Save the insertId and check notifications blacklist needed for next step
                //and join contracts to //get the payer_id of the updated contract to send notification

                newContractId = insertResult.insertId;

                const qry3 =
                    knex
                        .select('contract_id', 'payee_id', 'payer_id', 'list_owner_id', 'blacklisted_id')
                        .from('contracts')
                        .leftJoin('notifications_blacklist', function () {
                            this.on('contracts.payer_id', '=', 'notifications_blacklist.blacklisted_id')
                        })
                        .where({
                            contract_id: newContractId,
                            blacklisted_id: null
                        })
                        .toString();
                console.log("qr3 is", qry3); //see this on console. Very Good query
                return this.query(qry3);
            })
            .then(result => {
                //Step 4: Send notification to the payer
                console.log("Result from contract select= ", result.length);
                if (result.length) {
                    const qry4 =
                        knex
                            .insert({
                                sender_id: result[0].payee_id,
                                receiver_id: result[0].payer_id,
                                object_id: result[0].contract_id,
                                object_type: 'contracts',
                                notification_type: 'alert',
                                message: ' has requested a modification Contract with you.'
                            })
                            .into('notifications')
                            .toString();
                    console.log("qr4 is", qry4);
                    return this.query(qry4);
                }
                console.log("I should be here")
                return 0;
            })
            .then(() => {
                //Step 5: Send the new Contract as response using the saved insertId in newContract Id

                return this.query(
                    knex
                        .select('contract_id', 'title', 'payee_id', 'payer_id', 'parent_id',
                            'description', 'total_amount', 'remaining_amount',
                            'number_of_payments', 'payment_frequency', 'due_date', 'accepted_date',
                            'contract_status', 'is_latest', 'created_at', 'updated_at')
                        .from('contracts')
                        .where({
                            contract_id: newContractId
                        })
                        .toString()
                )
            })
    }

    acceptContractForUser(data) {
        //Step 1 Change the is_latest of the current active contract to 0 (Now the old version)
        const qry =
            knex('contracts')
                .where(function () {
                    this.where('contract_id', data.contractId)
                        .orWhere('parent_id', data.contractId)
                })
                .andWhere({contract_status: 'active'})
                .update({is_latest: 0})
                .toString();

        console.log("qry is =", qry);

        return this.query(qry)
            .then(() => {
                //Step 2 Change the pending and is_latest:1 to active (Now the new version)
                const qry2 =
                    knex('contracts')
                        .where(function () {
                            this.where('contract_id', data.contractId)
                                .orWhere('parent_id', data.contractId)
                        })
                        .andWhere({
                            contract_status: 'pending',
                            is_latest: 1
                        })
                        .update({contract_status: 'active'})
                        .toString();
                console.log("qry2 =", qry2);
                return this.query(qry2);
            })
            .then(() => {
                const qry3 =
                    knex
                        .select('contract_id', 'parent_id', 'title', 'description', 'total_amount',
                            'number_of_Payments', 'payment_frequency', 'due_date', 'accepted_date',
                            'contract_status', 'payer_id', 'payee_id', 'created_at',
                            'updated_at')
                        .from('contracts')
                        .where({
                            contract_id: data.contractId,
                            contract_status: 'active'
                        })
                        .toString()
                console.log("qry3 =", qry3);
                return this.query(qry3);
            })
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

    // PAYMENTS METHODS --------------------------------------------------*

    // Get all payments for current users
    getAllPaymentsFromUser(user) {

        return this.query(
            knex
                .select('payments.payment_id', 'payments.contract_id',
                    'payments.payment_type', 'payments.payment_amount',
                    'payments.payment_status', 'payments.due_date',
                    'payments.payment_date', 'payments.created_at',
                    'payments.updated_at')
                .from('payments')
                .join('contracts', function () {
                    this.on('payments.contract_id', '=', 'contracts.contract_id')
                })
                .where({
                    payee_id: user.users_user_id,
                    payment_status: 'active'
                })
                .orWhere({
                    payer_id: user.users_user_id,
                    payment_status: 'active'
                })
                .toString()
        )
            .then(payments => payments)
            .catch(error => error);
    }

    // Get all payments for current contract
    getAllPaymentsForContract(user, contractId) {
        return this.query(
            knex
                .select('payments.payment_id', 'payments.contract_id',
                    'payments.payment_type', 'payments.payment_amount',
                    'payments.payment_status', 'payments.due_date',
                    'payments.payment_date', 'payments.created_at',
                    'payments.updated_at')
                .from('payments')
                .join('contracts', function () {
                    this.on('payments.contract_id', '=', 'contracts.contract_id')
                })
                .where({
                    payee_id: user.users_user_id,
                    'payments.contract_id': contractId
                })
                .orWhere({
                    payer_id: user.users_user_id,
                    'payments.contract_id': contractId
                })
                .toString()
        )
            .then(payments => payments)
            .catch(error => error);
    }

    // Add payment for current contract
    addPaymentForContract(user, paymentData) {

        return this.query(
            knex
                .insert({
                    contract_id: paymentData.contractId,
                    currency_id: paymentData.currencyId,
                    due_date: paymentData.dueDate,
                    payment_date: paymentData.paidDate,
                    payment_amount: paymentData.amount,
                    payment_type: paymentData.type,
                    payment_status: paymentData.status
                })
                .into('payments')
                .toString()
        ).then(result => {

            // Returns all payments for current contract
            return this.query(
                knex
                    .select('payments.payment_id', 'payments.contract_id',
                        'payments.payment_type', 'payments.payment_amount',
                        'payments.payment_status', 'payments.due_date',
                        'payments.payment_date', 'payments.created_at',
                        'payments.updated_at')
                    .from('payments')
                    .join('contracts', function () {
                        this.on('payments.contract_id', '=', 'contracts.contract_id')
                    })
                    .where({
                        payee_id: user.users_user_id,
                        'payments.contract_id': paymentData.contractId
                    })
                    .orWhere({
                        payer_id: user.users_user_id,
                        'payments.contract_id': paymentData.contractId
                    })
                    .toString()
            )
                .then(payments => payments)
                .catch(error => error);

        })
            .catch(err => err);
    }

    modifyPayment(user, paymentData) {

        return this.query(
            knex('payments')
                .where('payment_id', paymentData.paymentId)
                .update({
                    payment_type: paymentData.type,
                    payment_amount: paymentData.amount,
                    due_date: paymentData.dueDate,
                    payment_date: paymentData.paidDate
                })
                .toString()
        )
            .then(payment => {

                return this.query(
                    knex
                        .select('payment_id', 'contract_id', 'payment_type',
                            'payment_amount', 'payment_status', 'due_date',
                            'payment_date', 'created_at', 'updated_at')
                        .from('payments')
                        .where('payment_id', paymentData.paymentId)
                        .toString()
                )
                    .then(payment => payment[0]);
            })
            .catch(error => error);

    }

    // Delete current payment
    deletePayment(user, paymentData) {

        return this.query(
            knex
                .delete()
                .from('payments')
                .where('payment_id', paymentData.paymentId)
                .toString()
        )
            .catch(error => error);
    }


    // CURRENCY METHODS --------------------------------------------------*

    // Get all currencies available in the systemn
    getAllCurrencies() {

        // Returns all payments for current contract
        return this.query(
            knex
                .select('*')
                .from('currencies')
                .toString()
        )
            .then(currencies => currencies)
            .catch(error => error);
    }
}

module.exports = DashboardlyDataLoader;

