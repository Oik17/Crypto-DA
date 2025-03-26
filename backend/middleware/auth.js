const jwt = require('jsonwebtoken');
const user=require("../models/userSchema");
require("dotenv").config();

async function authenticateToken(req,res,next){
    const authHeader=req.headers['authorization']
    const token= authHeader && authHeader.split(' ')[1];
    if(token==null) return res.send(401)

    jwt.verify(token, process.env.ACCESS_KEY_SECRET,(err,user)=>{
        if(err) return res.send(403).send
        req.user=user
        next()
    })
}

async function verifyRefreshToken(req, res, next) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'refreshToken is required' });
    }
    try {
        const username = await user.findOne({ refreshToken });
        if (!username) {
            return res.status(404).json({ message: 'Login again.' });
        }
        if (username.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refreshToken' });
        }
        jwt.verify(refreshToken, process.env.REFRESH_KEY_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({ message: 'refreshToken expired' });
            }
            req.user = user;
            next();
        
        });
    } 
    catch (error) {
        res.status(500).json({ error: error });
    }
}
module.exports={
    authenticateToken,
    verifyRefreshToken
}