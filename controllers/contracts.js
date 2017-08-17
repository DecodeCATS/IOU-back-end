const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const contractsController = express.Router();

    contractsController.get('/', onlyLoggedIn, (req, res) => {

        dataLoader.getAllActiveContractsOfUser(req.user)
            .then(contractsArray => {
                var mappedcontractsArray = contractsArray.map(contracts => {
                    var obj = {
                        id: contracts.contract_id,
                        parentId: contracts.parent_id,
                        title: contracts.title,
                        description: contracts.description,
                        total_amount: contracts.total_amount,
                        remainingAmount: contracts.remaining_amount,
                        numberOfPayments: contracts.number_of_payments,
                        paymentFrequency: contracts.payment_frequency,
                        dueDate: contracts.due_date,
                        acceptedDate: contracts.accepted_date,
                        status: contracts.contract_status,
                        payerId: contracts.payer_id,
                        payeeId: contracts.payee_id,
                        createdAt: contracts.created_at,
                        updatedAt: contracts.updated_at
                    };
                    return obj;
                });
                var contractsObj = {
                    contracts: mappedcontractsArray
                };

                res.status(200).json(contractsObj);
            })
            .catch(err => res.status(400).json({error: err.message}))
    });

    contractsController.get('/:id', onlyLoggedIn, (req, res) => {

        dataLoader.getContractHistoryFromContractId(req.user.users_user_id, req.params.id)
            .then(contractsArray => {

                contractsArray.sort(function (a, b) {
                    return b.contract_id - a.contract_id;
                });

                var mapContractsArray = contractsArray.map(function (e) {
                    var obj = {
                        id: e.contract_id,
                        parentId: e.parent_id,
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