const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const contractsController = express.Router();

    contractsController.get('/:id', onlyLoggedIn, (req, res) => {

        dataLoader.getContractHistoryFromContractId(req.user.users_user_id, req.params.id)
            .then(contractsArray => {

                contractsArray.sort(function (a, b) {
                    return b.contract_id - a.contract_id;
                });

                var mapContractsArray = contractsArray.map(function (e) {
                    var obj = {
                        id: e.contract_id,
                        partentId: e.parent_id,
                        title: e.title,
                        description: e.description,
                        total_amount: e.total_amount,
                        remainingAmount: e.remaining_amount,
                        numberOfPayments: e.number_of_payments,
                        paymentFrequency: e.payment_frequency,
                        dueDate: e.due_date,
                        acceptedDate: e.accepted_date,
                        status: e.contract_status,
                        payerId: e.payer_id,
                        payeeId: e.payee_id,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at
                    };
                    return obj;
                });

                var contractsObj = {
                    contracts: mapContractsArray
                };
                res.status(200).json(contractsObj);
            })
            .catch(err => res.status(400).json({error: err.message}));


    });


    return contractsController;
};