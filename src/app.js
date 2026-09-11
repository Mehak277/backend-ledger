const express=require('express');
const cookieParser=require("cookie-parser")



const app=express();
app.use(express.json());     //to parse json data from request body 
app.use(cookieParser());     //to parse cookies from request headers

/**
 * -Routes required
 */
const authRouter=require("./routes/auth.routes");
const accountRouter= require("./routes/account.routes")
const transactionRouter= require("./routes/transaction.routes")

/**
 * -Use routes
 */
app.get("/",(req,res)=>{
    res.send("Welcome to the backend ledger application")
})
app.use("/api/auth",authRouter);
app.use("/api/accounts",accountRouter);
app.use("/api/transactions",transactionRouter);

module.exports=app;    
