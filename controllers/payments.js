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
                        updatedAt: payments.updated_at
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
                        updatedAt: payments.updated_at
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

    paymentsController.post('/', onlyLoggedIn, (req, res) => {

        dataLoader.checkIfContractIsActive(req.user.users_user_id, req.body.contractId)
            .then(result => {
                console.log("result= ", result);
                return dataLoader.addPaymentForContract(req.user, req.body, result[0].payee_id)
            })
        //dataLoader.addPaymentForContract(req.user, req.body)
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
                        updatedAt: payments.updated_at
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

    paymentsController.patch('/', onlyLoggedIn, (req, res) => {

        dataLoader.modifyPayment(req.user, req.body)
            .then(payment => {

                var paymentObj = {
                    paymentId: payment.payment_id,
                    contractId: payment.contract_id,
                    type: payment.payment_type,
                    amount: payment.payment_amount,
                    status: payment.payment_status,
                    dueDate: payment.due_date,
                    paidDate: payment.payment_date,
                    createdAt: payment.created_at,
                    updatedAt: payment.updated_at
                };
                res.status(200).json(paymentObj);

            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    paymentsController.delete('/', onlyLoggedIn, (req, res) => {

        dataLoader.deletePayment(req.user, req.body)
            .then(payment => {

                res.sendStatus(204);

            })
            .catch(err => res.status(400).json({error: err.message}));

    });

    return paymentsController;
};