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
                // console.log("Error =", error.code);
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


    //NOTIFICATIONS_BLACKLIST METHODS

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
        //console.log("The Query is: ", q)
        return this.query(q);
    }

    addConnectionToBlacklist(blacklistedUserId, user) {
        //console.log("Current req.user=", user);
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
        //console.log("The Query is: ", q);
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
        /*Steps
        1.get the current user id
        2.check if user id = payee_id or payer_id
        3a.select all the contracts for said user where contract_status = active
        3b.and is_latest =1*/
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

        console.log('Im inside');

        return this.query(qr)
            .then(result => {
                //console.log("The first insertResult=", result);
                insertChecker = result; //insertChecker.insertId will have contract_id now
                //console.log('user is =', user)
                if(user.users_user_id === contractData.payeeId){
                    //if inside here user is the payee
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
                                blacklisted_id: null //this is important see the raw version of this query using console.log
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


    //check if contract can be cancelled by the current user
    checkIfContractIsCancelable(user, contractId){
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
    cancelActiveContract(user, contractId){
        //console.log("user is=", user);
        const  qry =
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
                        .leftJoin('notifications_blacklist', function() {
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
                if (result.length){
                    const  qry3 =
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
    checkIfContractIsChangeable(user, contractId){
        //console.log('The payee_id', user.users_user_id)
        const qry =
            knex
                .count('contract_id as isChangable')
                .from('contracts')
                .where(function() {
                    this.where(function () {
                        this.where('contract_status', 'active')
                            .orWhere('contract_status', 'pending')
                    })
                        .andWhere(function () {
                            this.where('contract_id', contractId)
                                .orWhere('parent_id', contractId)
                        })
                        .andWhere(function (){
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
    modifyActiveContract(user, modifiedContractData, contractId){

        let newContractId; //will be used to store the contract id

        const qry1 =
            knex
            //Get Everything that wont be changed, Need to update Apiary
                .select('contract_id','parent_id', 'payee_id', 'payer_id')
                .from('contracts')
                .where({
                    contract_id: contractId
                })
                .toString();

        console.log("The qry1 is",qry1);
        return this.query(qry1)
            .then(oldContract => {
                //Step 2: Create the new contract version

                if(!oldContract[0].parent_id){
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
                        .leftJoin('notifications_blacklist', function() {
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
                if (result.length){
                    const  qry4 =
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
            .then(()=>{
                //Step 5: Send the new Contract as response using the saved insertId in newContract Id

                return this.query(
                    knex
                        .select('contract_id','title', 'payee_id', 'payer_id', 'parent_id',
                                'description','total_amount', 'remaining_amount',
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
}





module.exports = DashboardlyDataLoader;


