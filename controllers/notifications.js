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
                        senderId: e.sender_id,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at
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

    return notificationController;
};