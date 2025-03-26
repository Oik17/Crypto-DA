const express = require('express');
const router = express.Router();


const {signup,login,refresh,logout,getAllUser}=require('../controllers/userAuth')
const {authenticateToken,verifyRefreshToken}= require('../middleware/authenticate')
router.get('/test', (req, res) => {
  res.send("hello");
});

router.post('/signup', async (req, res) => {
    signup(req,res);
  });

router.post('/login', async (req,res)=>{
    login(req,res);
})

router.post('/refresh', verifyRefreshToken,async(req,res)=>{
    refresh(req,res);
})

router.post('/logout', authenticateToken, async(req,res)=>{
    logout(req,res);
})

router.get('/getAll',authenticateToken,async(req,res)=>{
    getAllUser(req,res)
})

module.exports=router;    