const transactionModel=require('../models/transaction.model');
const ledgerModel=require('../models/ledger.model');    
const accountModel=require('../models/account.model');
const emailService=require('../services/email.service');
const mongoose=require('mongoose');
/**
 * Create a new transaction
 * 10 step transfer flow
 * 1. Validate the request body to ensure that all required fields are present and valid.
 * 2. Check if the idempotency key already exists in the database. If it does, return the existing transaction to prevent duplicate processing.
 * 3. Retrieve the fromAccount and toAccount from the database using their IDs. If either account does not exist, return an error.  
 * 4. Check if the fromAccount has sufficient balance to cover the transaction amount. If not, return an error.
 * 5. Create a new transaction document in the database with the status set to 'PENDING'.
 * 6. Create two ledger entries: one for the debit from the fromAccount and one for the credit to the toAccount.
 *  7. Update the balances of both accounts in the database to reflect the transaction.
 * 8. Update the transaction status to 'COMPLETED' in the database.
 * 9. Return a success response with the transaction details.
 * 10. If any error occurs during the process, catch the error and return an appropriate error response.
 */

async function createTransactionController(req, res) {
        // Validate the request body
        const { fromAccountId, toAccountId, amount, idempotencyKey } = req.body;
        if(!fromAccountId || !toAccountId || !amount || !idempotencyKey){
            return res.status(400).json({
                 message: 'FromAccount, toAccount, amount, and idempotencyKey are required' 
                });
        }
        const fromUserAccount = await accountModel.findOne({ _id: fromAccountId });

        const toUserAccount = await accountModel.findOne({ _id: toAccountId });
        if (!fromUserAccount || !toUserAccount) {
            return res.status(404).json({
                message: 'One or both accounts not found'
            });
        }
      //2. Check if the idempotency key already exists

    const isTransactionAleadyExists = await transactionModel.findOne({ idempotencyKey });

      if(isTransactionAleadyExists){
         if(isTransactionAleadyExists.status === 'COMPLETED'){
            return res.status(409).json({
                message: 'Duplicate idempotency key: transaction already completed',
                transaction: isTransactionAleadyExists
            });
         }
         if(isTransactionAleadyExists.status === 'PENDING'){ 
            return res.status(409).json({
                message: 'Transaction is still in progress',
                transaction: isTransactionAleadyExists
            });
      }
      if(isTransactionAleadyExists.status === 'FAILED'){
        return res.status(409).json({
            message: 'Transaction has failed previously',
            transaction: isTransactionAleadyExists
        });
      }
      if(isTransactionAleadyExists.status === 'REVERSED'){
                return res.status(409).json({
            message: 'Transaction has been reversed previously',
            transaction: isTransactionAleadyExists
        });
      }

    }
    // 3. Check if the fromAccount has sufficient balance to cover the transaction amount 

    if(fromUserAccount.status!=='ACTIVE' || toUserAccount.status!=='ACTIVE'){
        return res.status(400).json({
            message: 'One or both accounts are not active'
        });
    }   

    //4. Derive sender balance from ledger
    const balance= await fromUserAccount.getBalance();

    if(balance<amount){
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}, but the transaction amount is ${amount}`
        });
    }

    


   
    //5. Create a new transaction document in the database with the status set to 'PENDING'.
    let transaction;
    try{
    const session = await mongoose.startSession();
    session.startTransaction();

    [transaction] = await transactionModel.create([{
        fromAccount: fromAccountId,
        toAccount: toAccountId,
        amount: amount,
        idempotencyKey: idempotencyKey,
        status: 'PENDING'
    }], { session });
    await transaction.save({ session });
// 6 and 7 Create two ledger entries: debit and credit

  
    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccountId,
        amount: amount,
        transaction: transaction._id,
        type: 'DEBIT'
    }], { session });

    // wait for a moment to simulate processing time before creating the credit ledger entry
    await new Promise((resolve) => {
        setTimeout(resolve, 10 * 1000);
    });
    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccountId,
        amount: amount,
        transaction: transaction._id,
        type: 'CREDIT'
    }], { session });

    
     await transactionModel.findOneAndUpdate({ _id: transaction._id },
         { status: 'COMPLETED' }, 
         { session });
      

    // 8. Update the transaction status to 'COMPLETED' in the database.
    transaction.status = 'COMPLETED';
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();
     }catch(err){
        return res.status(400).json({
            message: 'Transaction is Pending or Failed due to some error,please try again later',
            error: err.message
        });
     }


    //9.Send email notifications to both users
    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        fromUserAccount._id,
        toUserAccount._id
    );
    
    // 10. Return a success response with the transaction details.
    res.status(201).json({
        message: 'Transaction completed successfully',
        transaction: transaction
    });

}

async function createInitialFundsTransaction(req, res) {
    const toAccountId = req.body.toAccountId || req.body.toAccount;
    const { amount, idempotencyKey } = req.body;
    if(!toAccountId || !amount || !idempotencyKey){
        return res.status(400).json({
             message: 'toAccountId, amount, and idempotencyKey are required' 
            });
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccountId });
    if(!toUserAccount) {
        return res.status(404).json({
            message: 'Account not found'
        });
    }
    if(toUserAccount.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            message: 'You can only add initial funds to your own account'
        });
    }
    const session= await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
        fromAccount: toUserAccount._id,
        toAccount: toUserAccount._id,
        amount: amount,
        idempotencyKey: idempotencyKey,
        status: 'PENDING'
    });
    await transaction.save({ session });
    const creditLedgerEntry = new ledgerModel({
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: 'CREDIT'
    });
    await creditLedgerEntry.save({ session });

    transaction.status = 'COMPLETED';
    await transaction.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message: 'Initial funds transaction completed successfully',
        transaction: transaction
    });
}
module.exports = {  createTransactionController ,
createInitialFundsTransaction
 };
