const userModel=require("../models/user.model");
const authController=require("../controllers/auth.controller");
const emailService= require("../services/email.service")
const jwt=require("jsonwebtoken");
const tokenBlacklistModel=require("../models/blackList.model")
//register user
/** 
*-  user register controller
*- POST /api/auth/register
*/

async function userRegisterController(req,res){
    const {email,password,name}=req.body;
    
    const isExists= await userModel.findOne({email: email});

    if(isExists){
        return res.status(422).json({
            message:"User already exists with this email",
            status: "failed"
        })
    }
    const user=await userModel.create({
        email,
        password,
        name
    })

    const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY);
    res.cookie("token",token);
   
    res.status(201).json({                         
       user:{
        _id:user._id,
        email:user.email,
        name:user.name
       }  
       ,token:token  
    });
     
    await emailService.sendRegistrationEmail(user.email,user.name)
}

/**
 * - User Login Controller
 * - POST  /api/auth/
 */
async function userLoginController(req,res){
      const{email,password}= req.body;
      // here password will not come as we have seelected passsowrd to not access
      const user= await userModel.findOne({email}).select("+password");

      if(!user){
        return res.status(401).json({
            message:"Email or password is INVALID"
        })
      }
      const isValidPassword= await user.comparePassword(password)

      if(!isValidPassword){
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
      }
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY);
    res.cookie("token",token);

    res.status(200).json({                         //200 as new user is not created just login
       user:{
        _id:user._id,
        email:user.email,
        name:user.name
       }  
       ,token:token  
    });


}

/**
 * user logout controller
 * POST /api/auth/logout
 */
async function userLogoutController(req,res){
    const token=req.cookies.token|| req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(400).json({
            message:"user logged out already"
        })
    }
    

    await tokenBlacklistModel.create({
        token:token
 })
     res.clearCookie("token")
        res.status(200).json({
    message:"user logged out successfully"  
        })
}


module.exports={userRegisterController,
    userLoginController,
    userLogoutController};