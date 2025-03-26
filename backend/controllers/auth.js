const bcrypt=require('bcrypt');
const user=require("../models/userSchema");
const jwt=require('jsonwebtoken');


async function signup(req,res){
    try{
        console.log("hello")
        const user_exists = await user.findOne({"email":req.body.email});
        console.log(user_exists)
        if (user_exists) {
            
            return res.status(400).json({error: "User already exists"});
        }
        else{
            
            const hashedPassword=await bcrypt.hash(req.body.password,10);
            const newUser=await user.create({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            })
            newUser.save()
            res.status(201).send("User created\n"+newUser)
        }
    }
    catch(err){
        res.status(500).send(err)
    }
}

async function login(req,res){
    try{
        const user_exists = await user.findOne({"email":req.body.email});
        
        if(user_exists==null){
            return res.status(400).json({message: "user does not exist"})
        }
        if(await bcrypt.compare(req.body.password,user_exists.password)){
            console.log("hello")
            const username=req.body.email;
            const user={email: username};
            const accessToken=jwt.sign(user,process.env.ACCESS_KEY_SECRET,{expiresIn: '15s'});
            const refreshToken=jwt.sign(user,process.env.REFRESH_KEY_SECRET,{expiresIn: '15m'})
            user_exists.refreshToken=refreshToken
            await user_exists.save();
            res.status(201).json({accessToken: accessToken, refreshToken: refreshToken});
        }
        else{
            res.status(500).send("Incorrect password");
        }
        
    } catch(err){
        res.status(500).send(err);
    }
}

async function refresh (req, res){
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: 'refreshToken is required' });
    }
    try {
        const User = await user.findOne({ refreshToken });
        if (!User) {
            return res.status(404).json({ message: 'Invalid refreshToken' });
        }

        const storedRefreshToken = User.refreshToken;
        console.log(storedRefreshToken)
        if (!storedRefreshToken) {
            return res.status(400).json({ message: 'Invalid refreshToken' });
        }
        const USER=user.email;
        const username={email: USER};
        const newAccessToken = jwt.sign(username,process.env.ACCESS_KEY_SECRET,{expiresIn: '15s'})
        res.header('Authorization', `Bearer ${newAccessToken}`);
        console.log("Hello")
        res.status(201).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(500).send(error);
    }
}

async function logout (req, res){
    try {
        const decoded = req.user;
        console.log(req.user)
        const username = await user.findOne({ email: decoded.email });
        if (!username) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("hello")
        console.log(username)
        username.refreshToken = null;
        await username.save();
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
}

async function getAllUser(req,res){
    try{
      const dataAll = await user.find().populate("blogs")   
      if(dataAll.length==0){
          return res.status(404).json({
          message: "No data found",
        })
      }
      else {
        return res.status(201).json(dataAll);
      }
    }
    catch(err){
      console.error(err);
      return res.status(500).send(err);
    }
}

module.exports={
    signup,
    login,
    refresh,
    logout,
    getAllUser
}