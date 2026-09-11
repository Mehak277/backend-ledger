const userModel= require("../models/user.model")

const jwt= require("jsonwebtoken")
const tokenBlacklistModel=require("../models/blackList.model")
async function authMiddleware(req,res,next){

    const token= req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(401).json({
            message : "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted= await tokenBlacklistModel.findOne({token:token})
    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access, token is blacklisted"
        })
    }
    try{
        const decoded= jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user= await userModel.findById(decoded.id);

        if(!user){
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            })
        }

        req.user=user

        return next()
        
    }catch(err){
        return res.status(401).json({
            message:"Unauthorized access, token is missing"
        })
    }
}

module.exports= {authMiddleware}
