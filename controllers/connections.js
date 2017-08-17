const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const connectionsController = express.Router();

    connectionsController.get('/', onlyLoggedIn, (req, res) => {

        dataLoader.getAllConnectionsFromUser(req.user.users_user_id)
            .then(connectionArray => {

                var mapConnectionsArray = connectionArray.map(connection => {
                    var obj = {
                        id: connection.user_id,
                        userName: connection.username,
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

    connectionsController.post('/search', onlyLoggedIn, (req, res) => {

        dataLoader.searchForConnection(req.body)
            .then(usersArray => {

                var mapUsersArray = usersArray.map(user => {
                    var obj = {
                        id: user.user_id,
                        userName: user.username,
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
    })

    connectionsController.post('/request', onlyLoggedIn, (req, res) => {

        dataLoader.requestNewConnection(req.user, req.body)
            .then(connection => {
                console.log(connection);
                res.sendStatus(204);
            })
            .catch(err => res.status(400).json({error: err.message}));

    })


    return connectionsController;
};