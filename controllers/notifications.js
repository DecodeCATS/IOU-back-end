const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const notificationController = express.Router();

    notificationController.get('/', onlyLoggedIn, (req, res) => {
        dataLoader.getAllNotificationForUser(req.user)
        .then(notificationsArray => {
            var notificationObj = {
                notifications: notificationsArray
            };
            res.status(200).json(notificationObj);
        })
        .catch(err => res.status(400).json({error : err.message}));
    });

    notificationController.delete('/', onlyLoggedIn, (req, res) => {

        dataLoader.deleteNotification(req.body.notificationId)
            .then(result => {

                res.sendStatus(204);
            })
            .catch(err => res.status(400).json({error : err.message}));

    });

    notificationController.get('/blacklist', onlyLoggedIn, (req,res) => {

    });

    notificationController.post('/blacklist', onlyLoggedIn, (req,res) => {

    });

    notificationController.delete('/blacklist', onlyLoggedIn, (req,res) => {

    });

    return notificationController;
}