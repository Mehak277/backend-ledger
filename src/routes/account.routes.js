const express= require("express");
const authMiddleware= require("../middleware/auth.middleware")
const accountController= require("../controllers/account.controller")


const router= express.Router()

/**
 * -POST /api/accounts/
 * - Create a  new account
 * - Protected Route
 */

router .post("/",authMiddleware.authMiddleware,accountController.createAccountController)

/**
 * - GET /api/accounts/
 * - Get all accounts for the authenticated user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountController);
 

/**
 * GET/api/accounts/balance/:accountId
 * - Get the balance of a specific account by its ID
 * - Protected Route
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController);
module.exports= router