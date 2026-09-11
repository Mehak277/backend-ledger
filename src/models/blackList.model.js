const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,   
        required: [true, 'Token is required for blacklisting'],
        unique: true,  // Ensure that the token is unique in the blacklist
    },
    
},{timestamps: true});

tokenBlacklistSchema.index({createdAt:1}, {
    expireAfterSeconds: 60*60 *24*30}); // Set the TTL index to expire documents after 1 hour (3600 seconds)        
     // Create an index on the token field for faster lookups

     const tokenBlacklistModel = mongoose.model('tokenBlacklist', tokenBlacklistSchema);

    module.exports = tokenBlacklistModel;