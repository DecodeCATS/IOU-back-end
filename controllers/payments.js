const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const paymentsController = express.Router();

    paymentsController.get('/active', onlyLoggedIn, (req, res) => {

        dataLoader.getAllPaymentsFromUser(req.user)
            .then(paymentsArray => {

                var mapPaymentsArray = paymentsArray.map(payments => {
                    var obj = {
                        paymentId: payments.payment_id,
                        contractId: payments.contract_id,
                        type: payments.payment_type,
                        amount: payments.payment_amount,
                        status: payments.payment_status,
                        dueDate: payments.due_date,
                        paidDate: payments.payment_date,
                        createdAt: payments.created_at,
                        updatedAt: payments.updated_at,
                    };
                    return obj;
                });

                var paymentObj = {
                    payments: mapPaymentsArray
                };
                res.status(200).json(paymentObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    paymentsController.get('/contracts/:id', onlyLoggedIn, (req, res) => {

        dataLoader.getAllPaymentsForContract(req.user, req.params.id)
            .then(paymentsArray => {

                var mapPaymentsArray = paymentsArray.map(payments => {
                    var obj = {
                        paymentId: payments.payment_id,
                        contractId: payments.contract_id,
                        type: payments.payment_type,
                        amount: payments.payment_amount,
                        status: payments.payment_status,
                        dueDate: payments.due_date,
                        paidDate: payments.payment_date,
                        createdAt: payments.created_at,
                        updatedAt: payments.updated_at,
                    };
                    return obj;
                });

                var paymentObj = {
                    payments: mapPaymentsArray
                };
                res.status(200).json(paymentObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    paymentsController.post('/contracts', onlyLoggedIn, (req, res) => {

        dataLoader.addPaymentForContract(req.user, req.body)
            .then(paymentsArray => {

                var mapPaymentsArray = paymentsArray.map(payments => {
                    var obj = {
                        paymentId: payments.payment_id,
                        contractId: payments.contract_id,
                        type: payments.payment_type,
                        amount: payments.payment_amount,
                        status: payments.payment_status,
                        dueDate: payments.due_date,
                        paidDate: payments.payment_date,
                        createdAt: payments.created_at,
                        updatedAt: payments.updated_at,
                    };
                    return obj;
                });

                var paymentObj = {
                    payments: mapPaymentsArray
                };
                res.status(200).json(paymentObj);
            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    return paymentsController;
};