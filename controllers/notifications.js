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

    notificationController.post('/blacklist', onlyLoggedIn, (req, res) => {
        dataLoader.addConnectionToBlacklist(req.body.userId, req.user)
            .then(insertResult => {
                if(insertResult.insertId){
                    return insertResult;
                }
                throw new Error ('Failed to add connection to backlist') ;
            })
            .then(blacklistArray => {
                var blacklistObj = {
                    blacklist: blacklistArray
                };
                res.status(201).json(blacklistObj);
            })
            .catch(err => res.status(400).json({error: err.message}));
    });

    // notificationController.delete('/blacklist', onlyLoggedIn, (req, res) => {
    //     dataLoader.removeConnectionFromBlacklist(req.bod.userId)
    //         .then(blacklistArray => {
    //             var blacklistObj = {
    //                 blacklist: blacklistArray
    //             };
    //             res.status(201).json(blacklistObj);
    //         })
    //         .catch(err => res.status(400).json({error: err.message}));
    // });

    return notificationController;
};