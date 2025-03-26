const bcrypt = require('bcrypt');
const user = require("../models/userSchema");
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // Import the logger

async function signup(req, res) {
    try {
        logger.info(`Signup attempt for user: ${req.body.email}`);
        
        const user_exists = await user.findOne({"email": req.body.email});
        logger.debug(`User exists check: ${user_exists ? 'Found' : 'Not found'}`);
        
        if (user_exists) {
            logger.warn(`Signup failed: User already exists - ${req.body.email}`);
            return res.status(400).json({error: "User already exists"});
        }
        else {
            logger.debug('Hashing password...');
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            
            const newUser = await user.create({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            });
            
            await newUser.save();
            logger.info(`New user created successfully: ${newUser.email}`);
            res.status(201).send("User created\n" + newUser);
        }
    }
    catch(err) {
        logger.error(`Signup error: ${err.message}`, { stack: err.stack });
        res.status(500).send(err);
    }
}

async function login(req, res) {
    try {
        logger.info(`Login attempt for user: ${req.body.email}`);
        
        const user_exists = await user.findOne({"email": req.body.email});
        
        if(user_exists == null) {
            logger.warn(`Login failed: User does not exist - ${req.body.email}`);
            return res.status(400).json({message: "user does not exist"});
        }
        
        logger.debug('Comparing passwords...');
        const passwordMatch = await bcrypt.compare(req.body.password, user_exists.password);
        
        if(passwordMatch) {
            logger.debug('Password match successful, generating tokens');
            
            const username = req.body.email;
            const userPayload = {email: username};
            
            const accessToken = jwt.sign(userPayload, process.env.ACCESS_KEY_SECRET, {expiresIn: '15s'});
            const refreshToken = jwt.sign(userPayload, process.env.REFRESH_KEY_SECRET, {expiresIn: '15m'});
            
            user_exists.refreshToken = refreshToken;
            await user_exists.save();
            
            logger.info(`User logged in successfully: ${username}`);
            res.status(201).json({accessToken: accessToken, refreshToken: refreshToken});
        }
        else {
            logger.warn(`Login failed: Incorrect password for user ${req.body.email}`);
            res.status(500).send("Incorrect password");
        }
        
    } catch(err) {
        logger.error(`Login error: ${err.message}`, { stack: err.stack });
        res.status(500).send(err);
    }
}

async function refresh(req, res) {
    const refreshToken = req.body.refreshToken;
    
    if (!refreshToken) {
        logger.warn('Token refresh failed: refreshToken is required');
        return res.status(400).json({ message: 'refreshToken is required' });
    }
    
    try {
        logger.debug(`Attempting to refresh token...`);
        
        const User = await user.findOne({ refreshToken });
        if (!User) {
            logger.warn('Token refresh failed: Invalid refreshToken - user not found');
            return res.status(404).json({ message: 'Invalid refreshToken' });
        }

        const storedRefreshToken = User.refreshToken;
        logger.debug(`Stored refresh token: ${storedRefreshToken}`);
        
        if (!storedRefreshToken) {
            logger.warn('Token refresh failed: Invalid refreshToken - token not stored');
            return res.status(400).json({ message: 'Invalid refreshToken' });
        }
        
        const USER = user.email;
        const username = {email: USER};
        const newAccessToken = jwt.sign(username, process.env.ACCESS_KEY_SECRET, {expiresIn: '15s'});
        
        res.header('Authorization', `Bearer ${newAccessToken}`);
        logger.info(`Access token refreshed successfully for user: ${User.email}`);
        res.status(201).json({ accessToken: newAccessToken });
    } catch (error) {
        logger.error(`Token refresh error: ${error.message}`, { stack: error.stack });
        res.status(500).send(error);
    }
}

async function logout(req, res) {
    try {
        const decoded = req.user;
        logger.debug(`Logout attempt for user: ${JSON.stringify(decoded)}`);
        
        const username = await user.findOne({ email: decoded.email });
        if (!username) {
            logger.warn(`Logout failed: User not found - ${decoded.email}`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        logger.debug(`User found: ${username.email}`);
        
        username.refreshToken = null;
        await username.save();
        
        logger.info(`User logged out successfully: ${decoded.email}`);
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        logger.error(`Logout error: ${err.message}`, { stack: err.stack });
        res.status(500).json({ error: err });
    }
}

async function getAllUser(req, res) {
    try {
        logger.debug('Fetching all users...');
        
        const dataAll = await user.find().populate("blogs");
        logger.debug(`Found ${dataAll.length} users`);
        
        if(dataAll.length == 0) {
            logger.info('No users found in database');
            return res.status(404).json({
                message: "No data found",
            });
        }
        else {
            logger.info(`Successfully retrieved ${dataAll.length} users`);
            return res.status(201).json(dataAll);
        }
    }
    catch(err) {
        logger.error(`Error fetching users: ${err.message}`, { stack: err.stack });
        return res.status(500).send(err);
    }
}

module.exports = {
    signup,
    login,
    refresh,
    logout,
    getAllUser
}
