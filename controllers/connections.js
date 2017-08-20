const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const connectionsController = express.Router();

    connectionsController.get('/', onlyLoggedIn, (req, res) => {

        dataLoader.getAllConnectionsFromUser(req.user.users_user_id)
            .then(connectionsArray => {

                var mapConnectionsArray = connectionsArray.map(connection => {
                    var obj = {
                        id: connection.user_id,
                        username: connection.username,
                        firstName: connection.first_name,
                        lastName: connection.last_name,
                        type: connection.user_type,
                        //isBlacklisted: connection.is_blacklisted,
                        createdAt: connection.created_at,
                        updatedAt: connection.updated_at
                    };
                    return obj;
                });

                var connectionObj = {
                    users: mapConnectionsArray
                };
                res.status(200).json(connectionObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    connectionsController.get('/organisations', onlyLoggedIn, (req, res) => {

        dataLoader.getAllOrganisationFromUser(req.user.users_user_id)
            .then(connectionsArray => {

                var mapConnectionsArray = connectionsArray.map(connection => {
                    var obj = {
                        id: connection.user_id,
                        username: connection.username,
                        firstName: connection.first_name,
                        type: connection.user_type,
                        createdAt: connection.created_at,
                        updatedAt: connection.updated_at
                    };
                    return obj;
                });

                var connectionObj = {
                    users: mapConnectionsArray
                };
                res.status(200).json(connectionObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });


    connectionsController.post('/search', onlyLoggedIn, (req, res) => {

        dataLoader.searchForConnection(req.body)
            .then(usersArray => {

                var mapUsersArray = usersArray.map(user => {
                    var obj = {
                        id: user.user_id,
                        username: user.username,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        type: user.user_type,
                        createdAt: user.created_at,
                        updatedAt: user.updated_at
                    };
                    return obj;
                });

                var usersObj = {
                    users: mapUsersArray
                };
                res.status(200).json(usersObj);
            })
            .catch(err => res.status(400).json({error: err.message}));
    });

    connectionsController.post('/request', onlyLoggedIn, (req, res) => {

        // Steps
        // 1. check if connection already exist
        // 2. if not request new connection &
        // send notification to friend (done by request New Connection)
        console.log("Outside")
        dataLoader.checkIfConnectionExists(req.user.users_user_id, req.body.userId)
            .then(result=> {
                console.log("inside", result.isConnected);
                if(!result.isConnected){
                    console.log("inside", result);
                    return dataLoader.requestNewConnection(req.user, req.body)
                        .then(connection => {
                            res.sendStatus(204);
                        });
                }
                throw new Error ("You are already connected")
            })
            .catch(err => res.status(400).json({error: err.message}))
    });

    connectionsController.post('/accept', onlyLoggedIn, (req, res) => {

        return Promise.all([dataLoader.acceptConnection(req.user.users_user_id, req.body.userId),
                            dataLoader.acceptConnection(req.body.userId, req.user.users_user_id)])
            .then(result => {
                //send notification
                console.log("result", result);
                return dataLoader.sendNotificationForAcceptedConnection(req.user, req.body, result)
            })
            .then(result => {
                //get all the connections now
                return dataLoader.getAllConnectionsFromUser(req.user.users_user_id);
            })
            .then(connectionsArray => {
                //send them to the user
                var mapConnectionsArray = connectionsArray.map(connection => {
                    var obj = {
                        id: connection.user_id,
                        username: connection.username,
                        firstName: connection.first_name,
                        lastName: connection.last_name,
                        type: connection.user_type,
                        createdAt: connection.created_at,
                        updatedAt: connection.updated_at
                    };
                    return obj;
                });

                var connectionObj = {
                    users: mapConnectionsArray
                };
                res.status(200).json(connectionObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    connectionsController.delete('/', onlyLoggedIn, (req, res) => {

        dataLoader.deleteConnection(req.user, req.body)
            .then(result => {

                res.sendStatus(204);
            })
            .catch(err => res.status(400).json({error: err.message}));
    });




    // BLACKLIST FUNCTIONS --------------------------------------------

    connectionsController.get('/blacklist', onlyLoggedIn, (req, res) => {
        dataLoader.getAllBlacklistedPeopleForUser(req.user)
            .then(blacklistArray => {

                var mapBlacklistArray = blacklistArray.map(function (e) {
                    var obj = {
                        id: e.user_id,
                        username: e.username,
                        firstName: e.first_name,
                        lastName: e.last_name,
                        type: e.user_type,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at
                    };
                    return obj;
                });

                var blacklistObj = {
                    blacklist: mapBlacklistArray
                };
                res.status(200).json(blacklistObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    // End point to add a connection to blacklist
    connectionsController.post('/blacklist', onlyLoggedIn, (req, res) => {
        //TODO: check if person has an active contract with the connection
        dataLoader.checkBlacklistedConnection(req.body.userId, req.user)
            .then(result =>{
                // Check if already blacklisted
                if(result[0].isBlacklisted >=1){
                    throw new Error ('Connection is already in blacklist')
                }
                return result[0];
            })
            .then(() => {
                // Add to blacklist
                return dataLoader.addConnectionToBlacklist(req.body.userId, req.user);
            })
            .then(insertResult => {
                // If insert was success return entire blacklist
                console.log(insertResult);
                if(insertResult.affectedRows){
                    return dataLoader.getAllBlacklistedPeopleForUser(req.user);
                }
                throw new Error ('Failed to add connection to backlist') ;
            })
            .then(blacklistArray => {
                // Map to match the apiary standard
                var mapBlacklistArray = blacklistArray.map(function (e) {
                    var obj = {
                        id: e.user_id,
                        username: e.username,
                        firstName: e.first_name,
                        lastName: e.last_name,
                        type: e.user_type,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at
                    };
                    return obj;
                });

                var blacklistObj = {
                    blacklist: mapBlacklistArray
                };
                res.status(201).json(blacklistObj);
            })
            .catch(err => res.status(400).json({error: err.message}));
    });

    // Endpoint for deleting a blacklist
    connectionsController.delete('/blacklist', onlyLoggedIn, (req, res) => {
        dataLoader.checkBlacklistedConnection(req.body.userId, req.user)
            .then(result => {

                // Check if already blacklisted
                if(result[0].isBlacklisted == 0){
                    throw new Error ('Connection is not on blacklist')
                }
                return result[0];
            })
            .then(() => {
                //remove from blacklist
                return dataLoader.removeConnectionFromBlacklist(req.body.userId, req.user);
            })
            .then(deleteResult => {
                // Check if delete was success
                console.log('The delete result is =', deleteResult);
                if(deleteResult.affectedRows){
                    return dataLoader.getAllBlacklistedPeopleForUser(req.user);
                }
                throw new Error ('Failed to delete connection from backlist') ;
            })
            .then(blacklistArray => {
                var mapBlacklistArray = blacklistArray.map(function (e) {
                    var obj = {
                        id: e.user_id,
                        username: e.username,
                        firstName: e.first_name,
                        lastName: e.last_name,
                        type: e.user_type,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at
                    };
                    return obj;
                });

                var blacklistObj = {
                    blacklist: mapBlacklistArray
                };
                res.status(200).json(blacklistObj);
            })
            .catch(err => res.status(400).json({error: err.message}));
    });



    return connectionsController;
};