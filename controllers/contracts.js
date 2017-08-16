const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const contractsController = express.Router();

    contractsController.get('/:id', onlyLoggedIn, (req, res) => {

    });



    return contractsController;
}