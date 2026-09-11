const {Router} = require('express');
const { createAccountController } = require('../controllers/account.controller');
const { authMiddleware } = require('../middleware/auth.middleware');    
const transactionController = require('../controllers/transaction.controller');
const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 * - Protected Route 
 */
transactionRoutes.post('/', authMiddleware, transactionController.createTransactionController);

transactionRoutes.post('/system/initial-funds', authMiddleware, transactionController.createInitialFundsTransaction);


module.exports = transactionRoutes;