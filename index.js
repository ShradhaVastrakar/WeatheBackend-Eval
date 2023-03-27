
const express = require("express")
const app = express()
app.use(express.json())
require("dotenv").config()
const {connection} = require("./db")
const redis = require('redis');
const {authMiddleware} = require("./middleware/authentication")
const {userRouter} = require("./routes/user.route")

const winston = require('winston');
const expressWinston = require("express-winston")
const winstonmongodb = require("winston-mongodb")

app.get("/",(req,res) =>{
    res.send("WELCOME TO HOME PAGE")
})

app.use(expressWinston.logger({
    statusLevels : true,
    transports: [
      new winston.transports.Console({
        level : "info",
        json: true
      }),
      new winston.transports.File({
        level : "info",
        json : true,
        filename:"logs.json"
      }),
      new winston.transports.MongoDB({
       level : "info",
       db: `${process.env.mongoURL}`,
       json : true
      })  
    ],
    format: winston.format.json()

  }));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
  
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

app.use("/users", userRouter)


app.listen(`${process.env.port}`, async ()=>{
    try{
        await connection
        console.log("Connected to DB")
    } catch(err){
        console.log(err.message)
    }
    console.log(`Server is listening at port ${process.env.port}`)
})
