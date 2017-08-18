const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const notificationController = express.Router();

    notificationController.get('/', onlyLoggedIn, (req, res) => {
        dataLoader.getAllNotificationsForUser(req.user)
            .then(notificationsArray => {

                var mapNotificationsArray = notificationsArray.map(function (e) {
                    var obj = {
                        id: e.notification_id,
                        message: e.message,
                        objectId: e.object_id,
                        objectType: e.object_type,
                        senderId: e.sender_id
                    };
                    return obj;
                });

                var notificationObj = {
                    notifications: mapNotificationsArray
                };
                res.status(200).json(notificationObj);
            })
            .catch(err => res.status(400).json({error: err.message}));
    });

    notificationController.delete('/', onlyLoggedIn, (req, res) => {
        dataLoader.deleteNotification(req.body.notificationId)
            .then(result => {

                res.sendStatus(204);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    notificationController.get('/blacklist', onlyLoggedIn, (req, res) => {
        dataLoader.getAllBlacklistedPeopleForUser(req.user)
            .then(blacklistArray => {

                var mapBlacklistArray = blacklistArray.map(function (e) {
                    var obj = {
                        id: e.user_id,
                        userName: e.username,
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

    //end point to add a connection to blacklist
    notificationController.post('/blacklist', onlyLoggedIn, (req, res) => {
        dataLoader.checkBlacklistedConnection(req.body.userId, req.user)
            .then(result =>{
                //check if already blacklisted
                //console.log('result = ',result[0])
                if(result[0].isBlacklisted >=1){
                   throw new Error ('Connection is already in blacklist')
                }
                return result[0];
            })
            .then(() => {
                //add to blacklist
                return dataLoader.addConnectionToBlacklist(req.body.userId, req.user);
            })
            .then(insertResult => {
                //if insert was success return entire blacklist
                if(insertResult.insertId){
                    return dataLoader.getAllBlacklistedPeopleForUser(req.user);
                }
                throw new Error ('Failed to add connection to backlist') ;
            })
            .then(blacklistArray => {
                //map to match the apiary standard
                var mapBlacklistArray = blacklistArray.map(function (e) {
                    var obj = {
                        id: e.user_id,
                        userName: e.username,
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

    //endpoint for deleting a blacklist
    notificationController.delete('/blacklist', onlyLoggedIn, (req, res) => {
        dataLoader.checkBlacklistedConnection(req.body.userId, req.user)
            .then(result =>{
                //check if already blacklisted
                //console.log('result = ',result[0])
                if(result[0].isBlacklisted === 0){
                    throw new Error ('No such connection on blacklist')
                }
                return result[0];
            })
            .then(() => {
                //remove from blacklist
                return dataLoader.removeConnectionFromBlacklist(req.body.userId, req.user);
            })
            .then(deleteResult => {
                //check if delete was success
                console.log('The delete result is =', deleteResult);
                if(!deleteResult.insertId){
                    return dataLoader.getAllBlacklistedPeopleForUser(req.user);
                }
                throw new Error ('Failed to delete connection from backlist') ;
            })
            .then(blacklistArray => {
                var mapBlacklistArray = blacklistArray.map(function (e) {
                    var obj = {
                        id: e.user_id,
                        userName: e.username,
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

    return notificationController;
};