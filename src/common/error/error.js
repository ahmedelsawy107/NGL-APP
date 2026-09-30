export class AppError extends Error{



    statusCode;
    isOperational;

    constructor(message, statusCode, isOperational = true){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
    }
}


const err = new AppError('message', 404)