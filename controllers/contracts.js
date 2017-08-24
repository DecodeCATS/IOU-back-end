const express = require('express');

const onlyLoggedIn = require('../lib/only-logged-in');

module.exports = (dataLoader) => {
    const contractsController = express.Router();

    contractsController.get('/all', onlyLoggedIn, (req, res) => {
        dataLoader.getAllContractsOfUser(req.user)
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
                        isLatest: contracts.is_latest,
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
            .catch(err => res.status(400).json({error: err.message}));
    });

    //get all the ACTIVE contracts of current user
    contractsController.get('/active', onlyLoggedIn, (req, res) => {
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
                        isLatest: contracts.is_latest,
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
            .catch(err => res.status(400).json({error: err.message}));
    });


    //createNewContract
    contractsController.post('/', onlyLoggedIn, (req, res) => {

        dataLoader.createNewContract(req.user, req.body)
            .then(contract => {
                console.log('The new contract is', contract)
                return dataLoader.getAllContractsOfUser(req.user)
            })
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
                        isLatest: contracts.is_latest,
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
            .catch(err => res.status(400).json({error: err.message}));
    });

    //cancel the current contract
    contractsController.delete('/:id', onlyLoggedIn, (req, res) => {
        dataLoader.checkIfContractIsCancelable(req.user, req.params.id)
            .then(result => {
                //Step 1: checking if contract can be cancelled
                console.log('isCancelable', result[0].isCancelable);
                if (!result[0].isCancelable) {
                    throw new Error('You currently do not have permission to cancel this contract')
                }
                //console.log('isChangeable',result[0]);
                return result[0];
            })
            .then(result => {
                //Step 2: cancelling the contract
                console.log("cancelActiveContract=", result);
                return dataLoader.cancelActiveContract(req.user, req.params.id);
            })
            .then(result => {
                //step 3 sending notification to user
                console.log("result from delete", result);
                var msgObj = {message: 'The Contract has been cancelled'}
                res.status(204).json(msgObj)
            })
            .catch(err => res.status(400).json({error: err.message}));
    });

    //modify the current contract
    contractsController.patch('/:id', onlyLoggedIn, (req, res) => {
        dataLoader.checkIfContractIsChangeable(req.user, req.params.id)
            .then(result => {
                //Step 1: checking if contract can be cancelled
                console.log('isChangable', result[0].isChangable)
                if (!result[0].isChangable) {
                    throw new Error('You currently do not have permission to modify this Contract')
                }
                else if (result[0].isChangable > 1) {
                    throw new Error('This Contract already has Modifications pending')
                }
                //console.log('isChangeable',result[0]);
                return result[0];
            })
            .then(result => {
                //Step 2: modifying the contract
                //And sending notifications
                console.log("cancelActiveContract=", result);
                return dataLoader.modifyActiveContract(req.user, req.body, req.params.id);
            })
            .then(newContract => {
                //Checking the blacklist of users
                console.log("result from modify", newContract[0]);
                //step 4: send back the contract to front end
                //response was not nested into contracts, ask chhaya
                var contractObj = {
                    id: newContract[0].contract_id,
                    parentId: newContract[0].parent_id,
                    title: newContract[0].title,
                    description: newContract[0].description,
                    total_amount: newContract[0].total_amount,
                    remainingAmount: newContract[0].remaining_amount,
                    numberOfPayments: newContract[0].number_of_payments,
                    paymentFrequency: newContract[0].payment_frequency,
                    dueDate: newContract[0].due_date,
                    acceptedDate: newContract[0].accepted_date,
                    status: newContract[0].contract_status,
                    payerId: newContract[0].payer_id,
                    payeeId: newContract[0].payee_id,
                    isLatest: newContract[0].is_latest,
                    createdAt: newContract[0].created_at,
                    updatedAt: newContract[0].updated_at
                };
                console.log(contractObj);
                res.status(200).json(contractObj)
                //res.status(200).json({msg: "heloo"})
            })
            .catch(err => res.status(400).json({error: err.message}));
    });


    contractsController.get('/proposals', onlyLoggedIn, (req, res) => {
        console.log("hello");
        dataLoader.getAllProposedContractsOfUser(req.user)
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
                        isLatest: contracts.is_latest,
                        createdAt: contracts.created_at,
                        updatedAt: contracts.updated_at
                    };
                    return obj;
                });
                var contractsObj = {
                    proposals: mappedcontractsArray
                };

                res.status(200).json(contractsObj);
            })
            .catch(err => res.status(400).json({error: err.message}))
    });

    contractsController.post('/proposals', onlyLoggedIn, (req, res) => {
        //TODO: See the return might need fixing
        dataLoader.acceptContractForUser(req.user, req.body)
            .then(result => {
                var acceptedContractObj = {
                    id: result.contract_id,
                    parentId: result.parent_id,
                    title: result.title,
                    description: result.description,
                    totalAmount: result.total_amount,
                    remainingAmount: result.remaining_amount,
                    numberOfPayments: result.number_of_payments,
                    paymentFrequency: result.payment_frequency,
                    dueDate: result.dueDate,
                    acceptedDate: result.accepted_date,
                    status: result.contract_status,
                    payerId: result.payer_id,
                    payeeId: result.payee_id,
                    isLatest: result.is_latest,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt
                };
                res.status(200).json(acceptedContractObj);
            })
            .catch(err => res.status(400).json({error: err.message}))
    });

    //get all the contracts versions of the contract with given id
    contractsController.get('/:id', onlyLoggedIn, (req, res) => {
        //console.log(req.params)
        dataLoader.getContractHistoryFromContractId(req.user.users_user_id, parseInt(req.params.id))
            .then(contractsArray => {

                contractsArray.sort(function (a, b) {
                    return b.contract_id - a.contract_id;
                });

                var mapContractsArray = contractsArray.map(function (e) {
                    //console.log(e, e.payee_id, "mapped e object")
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
                        isLatest: e.is_latest,
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
            .catch(err => {
                if (err.message === 'Cannot read property \'payee_id\' of undefined') {
                    res.status(400).json({error: 'No such contract'});
                }
                else {

                    res.status(400).json({error: err.message});
                }
            });
    });


    return contractsController;
};