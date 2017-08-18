const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const currenciesController = express.Router();

    currenciesController.get('/', onlyLoggedIn, (req, res) => {

        dataLoader.getAllCurrencies()
            .then(currenciesArray => {

                var mapCurrenciesArray = currenciesArray.map(currency => {
                    var obj = {
                        currencyId: currency.currency_id,
                        name: currency.name,
                        symbol: currency.symbol,
                        currencyCode: currency.currrency_code
                    };
                    return obj;
                });

                var currencyObj = {
                    currencies: mapCurrenciesArray
                };
                res.status(200).json(currencyObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    return currenciesController;
};