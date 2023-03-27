
const express = require("express");
const {User} = require("../models/user.model")

const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const redis = require('redis');
const {authMiddleware} = require("../middleware/authentication")
const {validateCity} = require("../middleware/cityValidation")
const rateLimit = require('express-rate-limit')
const password = process.env.REDIS_PASSWORD


  

const client = redis.createClient({
    url : `redis://default:${password}@redis-17097.c302.asia-northeast1-1.gce.cloud.redislabs.com:17097`
});

client.connect()

const userRouter = express.Router();

userRouter.post('/signup', async (req, res, next) => {
    try {
      const {  email, password } = req.body;
  
      // Check if user already exists
      const userExists = await User.findOne({ email  });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create a new user
      const hashed = bcrypt.hashSync(password,5)
      const user = new User({ email, password : hashed });
      await user.save();
  
      res.json({ message: 'User created successfully' });
    } catch (error) {
      res.send(error);
    }
  });


    
  userRouter.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
  
      // Find the user by username
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      // Compare the password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
  
      // Create a JWT
      const token = jwt.sign({ userId: user._id }, `${process.env.JWT_SECRET}`, {
        expiresIn: '5h'
      });
      const reftoken = jwt.sign({userId:user._id },
        `${process.env.REF_SECRET}`,{expiresIn:'10h'
       });
       client.set(reftoken, email);

       res.send({ msg : "Login Successfull",token, reftoken});

      
  
    } catch (error) {
      console.log(error);
    }
  });

  ///for retriveing weather 

  userRouter.get('/weather/:city', validateCity, rateLimit({
    windowMs: 3 * 60 * 1000,
    max: 1,
    message: "Please try again after 3 minutes",
  }), async (req, res) => {
    // const {city} = req.params;

    const cached_weather = await client.hGet( "weatherhm",`${req.params}`)
    
    if(cached_weather){
        res.send(cached_weather)
    } 
    else{
        let response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${req.params}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`).then((res) => res.json()).catch((err) => console.log(err.message));
        console.log(response)
        response = JSON.stringify(response)
        await client.hSet("weatherhm",`${req.params}`, `${response}`)
        
        res.json(response.data);
    }
    
  });

  //FOR LOGOUT

  userRouter.delete('/logout', authMiddleware, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    client.set(token, 'blacklisted');
    res.sendStatus(204);
  });





















module.exports = {
    userRouter
}