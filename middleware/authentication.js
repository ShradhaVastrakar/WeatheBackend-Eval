const jwt = require('jsonwebtoken');
require("dotenv");
const {User} = require("../models/user.model")


const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if(blacklist.includes(token)){
        return res.send("Please login first")
    }
    const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET}`);
    const { userId } = decodedToken;
    

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Attach the user to the request object
    req.user = user;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send('Access token expired');
    }else{
      return res.status(401).json({ message: 'Unauthorized'});
    }
   
  }
};

module.exports = {authMiddleware};