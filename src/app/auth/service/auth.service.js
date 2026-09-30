import { sendEmail } from "../../../common/email/nodemailer.js";
import * as authRepository from "../repository/auth.repository.js";
import * as otpRepository from "../repository/otp.repository.js";
import * as userRepository from "../../user/repository/user.repository.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { toMs } from "../../../common/utils/time.js";
import { invalidCode, invalidPassword, otpExpired } from "../errors.js";
import { userAlreadyExist, userAlreadyVerified, userNotVerified, userNotExist } from "../../user/errors.js";
import { generateOTPCode } from "../../../common/utils/otp.js";
import { generateToken } from "../utils/token.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../../common/error/error.js";




export async function register(userData){
    // const x =10;
    // x=17;
    // 1. check user existence
    const userExist = await authRepository.checkUserExistByEmail(userData.email);
    // 2. if yes, throw an error.
    if(userExist) throw userAlreadyExist;
    // 3. prepared data [hash-password]
    userData.password = await hashPassword(userData.password);
    // 4. save user into DB -> isVerified: false
    const creatUser = await authRepository.createUser(userData);
    // 5. generate  and save otp into DB 
    const code = generateOTPCode();
    await otpRepository.createOTP({
         code: code,
         email: userData.email,
         expiresAt: new Date( Date.now() + toMs(5, 'minutes'))
    });
    // 6. send email verification otp
    await sendEmail(userData.email, 'verification code', `<h1> your verification code is ${code} </h1>`);

    return creatUser; 
}

export async function verifyAccount(email, code){
    // 1.check user existence
    const user = await authRepository.checkUserExistByEmail(email);
    // 1.1 if you don't exist >> "User not exist."
    if(!user) throw new Error('User Not Exists.');
    // 1.2 if is verified = true >> error "You already verified"
    if(user.isVerified === true) throw userAlreadyVerified;
    // 2. check otp validation 
    const otp = await otpRepository.getOtpByEmail(email);
    // 2.1 not exist into DB >> error >> "otp expired" >> resend otp
    if(!otp) throw otpExpired;
    // 2.2 otp stored in DB >> code not equal code stored >> error >> 'Invalid otp'
    if(otp.code !== code) throw invalidCode;
    // 3. Switch your isVerified to true [update user]
    const updatedUser = await userRepository.updateUserByEmail(email, {isVerified: true})
    // 4. delet otp from DB
    await otpRepository.deleteOTPsByEmail(email);

    return updatedUser;
}

export async function login(email, password){
    // 1. check user existence
    const user = await authRepository.checkUserExistByEmail(email) // {} | null
    // 1.1 not exist
    if (!user) throw userNotExist;
    // 1.2 not verified
    if (user.isVerified === false) throw userNotVerified;
    // 2. compare password
    const match = await comparePassword(password, user['password'])
    if (!match) throw invalidPassword;
    // 3. generate access Token 
    return generateToken({id: user._id, name: user.name});
}

export async function sendOtp(email){
    // 1. check user existence.
    const user = await authRepository.checkUserExistByEmail(email);
    if (!user) throw userNotExist;
    // 2. delet all old OTPs
    await otpRepository.deleteOTPsByEmail(email);
    // 3. generate OTP and save it into DB
    const code = generateOTPCode();
    await otpRepository.createOTP({
        code: code,
        email: email,
        expiresAt: new Date( Date.now() + toMs(3, 'minutes'))
    })
    // 4. send otp email
    await sendEmail(email, 'new otp', `<p>your new otp is ${code}</p>`)

}


export async function resetPassword (email, code, newPassword){
    // 1.verify otp code
    const otp = await otpRepository.getOtpByEmail(email);
    if(!otp) throw otpExpired;
    if(otp.code !== code) throw invalidCode;
    // 2. hashpassword
    const hashedPassword = await hashPassword(newPassword);
    // 3. update User Password
    await userRepository.updateUserByEmail(email, {password: hashedPassword})
    // 4. delete otp
    await otpRepository.deleteOTPsByEmail(email);
}



export async function loginWithGoogle(idToken){
    // 1. verify idToken
    const payload = await verifyGoogleToken(idToken);
    // 2. check user exists
    const user = await authRepository.checkUserExistByEmail(payload.email);
    // 3. if exists >> generate token
    if(user){
        return generateToken(
            {
                id: user._id,
                email: user.email
            }
        );
    }
    // 4. if not exit create user >> generate Token
    const createdUser = await authRepository.createUser({
        name: payload.name,
        email: payload.email,
        provider: 'google',
        isVerified: true
    });
    return generateToken({
        id: createdUser.id,
        email: createdUser.email
    })
}