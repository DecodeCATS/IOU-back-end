const express = require('express');
var md5 = require('js-md5');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
  const authController = express.Router();

  // Create a new user (signup)
  authController.post('/users', (req, res) => {

    // Hash email
    var hash = md5(req.body.email);

    dataLoader.createUser( {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        avatar_url: `https://www.gravatar.com/avatar/${hash}?s=60`,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
    })
    .then(user => {
      console.log(user);
      var objUser = {
        userName: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        password: user.password,
        email: user.email,
        description: user.description,
        avatarUrl: user.avatar_url
      };
      console.log('my object', objUser);
      res.status(201).json(objUser);

    })
    .catch(err => res.status(401).json({error: err.message}));
  });

  // Create a new session (login)
  authController.post('/sessions', (req, res) => {
    dataLoader.createTokenFromCredentials(req.body.email, req.body.password)
    .then(token => {
      res.status(201).json({ token: token })
    })
    .catch(err => res.status(401).json({error: err.message}));
  });


  // Logout from a session (logout)
  authController.delete('/sessions', onlyLoggedIn, (req, res) => {
    console.log("req.sessionToken= ", req.sessionToken);
    if (req.sessionToken) {
      dataLoader.logoutUser(req.sessionToken)
        .then(() => res.status(204).end())
        .catch(err => res.status(400).json(err));
    } else {
      res.status(401).json({ error: 'Invalid session token' });
    }
  });


  // Retrieve current user
  authController.get('/me', onlyLoggedIn, (req, res) => {
      dataLoader.getUserFromSession(req.sessionToken)
          .then(user => {
              var objUser = {
                  id: user.users_user_id,
                  userName: user.users_username,
                  firstNamne: user.users_first_name,
                  lastName: user.users_last_name,
                  type: user.users_user_type,
                  description: user.users_description,
                  email: user.users_email,
                  avatarUrl: user.users_avatar_url,
                  createdAt: user.users_created_at,
                  updatedAt: user.users_updated_at
              };
              res.status(201).json(objUser);
          })
  });

  return authController;
};
