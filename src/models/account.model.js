const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")
const accountSchema= new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required:[ true," Account must  associated with a user "],
        index: true

    },
    status:{
        type: String,
        enum:{
            values: ["ACTIVE","FROZEN", "CLOSED"],
            message:"Status can be ACTIVE FROZEN OR CLOSED"
        },
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required:[true, "Currency is required for creating an account"],
        default:"INR"
    }
    //balance cant be directly stored thats why we use ledger 
   
}, {
    timestamps: true

})
accountSchema.index({user:1, status: 1})            // accountSchema we are creating copound index if we need to find the user.

accountSchema.methods.getBalance = async function() {
    // Implementation for getting account balance
    const balanceData= await ledgerModel.aggregate([
        {$match: { account: this._id }},
        {$group: {
            _id: null,
            totalDebit: { $sum: { $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0 ] } },
            totalCredit: { $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0 ] } }
        }},
        {$project: {
            balance: { $subtract: ["$totalCredit", "$totalDebit"] }
        }}
    ]);
    if(balanceData.length === 0){
        return 0;
    }
    
    return balanceData[0].balance;
};
const accountModel= mongoose.model("account",accountSchema)

module.exports= accountModel