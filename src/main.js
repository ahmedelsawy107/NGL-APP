import { config } from 'dotenv';
import './common/db/mongoose.js'
import express from 'express'
import authRouter from './app/auth/auth.route.js';
import userRouter from './app/user/user.route.js';
import messageRouter from './app/message/message.route.js';
import {OTP} from './app/auth/model/otp.model.js'
import { error } from 'node:console';
import { logger } from './common/logger/logger.js';
import cors from 'cors';
// loading env variables
config(); 

const app = express();

app.use(cors({origin: 'http://localhost:4200'}));

// parse incoming requests buffer to object
app.use(express.json());

// routes navigate to features
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/message', messageRouter);


// global error handler

app.use((err, req, res, next)=>{
    
    logger.error(err.message);
    
    if(err.isOperational === true){
    return res.status(err.statusCode).json({
        message: err.message,
        success: false,
        // stack: err.stack
    })
}

    return res.status(500).json({
        error: 'Something went wrong', success: false,
    })
})
app.listen(3000, ()=>
    logger.info("server running on port 3000")
)

