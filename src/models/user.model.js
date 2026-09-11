const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");




const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:[  true,"Email is required for creating user"],
        trim:true,      //no space before and after email
        lowercase:true,  //convert email to lowercase
         match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']    ,          //regex needed
         unique:[   true,"Email already exists"]   //email should be unique
     },
    name:{
        type:String,
        required:[  true,"Name is required for creating an account"]
    },
    password:{
        type:String,
        required:[  true,"Password is required for creating an account"],
        minlength:[ 6,"Password should be at least 6 characters long"],
        select:false   //to hide password when fetching user data
    },
    systenUser:{
        type:Boolean,
        default:false,
        immutable:true,   //system user cannot be modified
         select:false   //system user cannot be fetched
    }
},{
    timestamps:true        //when user is created and updated
});


userSchema.pre("save",async function(){     //data is saves then this function will run
      if(!this.isModified("password")){     //if password is not modified then move to next middleware
        return ;
      }
      const hash= await bcrypt.hash(this.password,10)           //hash password with salt rounds 10

      this.password=hash;     //replace plain password with hashed password
      return ;
})


//method to compare password
userSchema.methods.comparePassword=async function(password){
    console.log(password,this.password);
    
    return await bcrypt.compare(password,this.password);      //compare entered password with hashed password in database
}

const userModel=mongoose.model("user", userSchema);

module.exports=userModel;