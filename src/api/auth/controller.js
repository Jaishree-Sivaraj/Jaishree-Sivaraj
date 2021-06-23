import jwt from 'jsonwebtoken'
import { Strategy as JwtStrategy } from 'passport-jwt'
import nodemailer from 'nodemailer'
import { sign, verify } from '../../services/jwt'
import { success } from '../../services/response/'
import { jwtSecret, masterKey } from '../../config'
import { User } from '../user'

export const login = ({ user }, res, next) => {
  sign(user.id)
    .then((response) => {
      if(user){
        if(user.roleId.roleName == 'SuperAdmin'){
          //Generating 4 digit random number for OTP
          let otpNumber = Math.floor(1000 + Math.random() * 9000);
          //update the otp value in user data
          let updateObject = { otp: otpNumber ? otpNumber : '' };
          User.updateOne({ _id: user.id }, 
            { 
              $set: updateObject
            }, function(err, updatedUser) {
              console.log('updatedUser', updatedUser);
            }
          );

          //nodemail code will come here to send OTP
          const content = `
            Hey, ${user.name}.<br/><br/>
            You requested a OTP for your esgapi account.<br/>
            Please use the following code as your OTP - <b>${otpNumber}</b>.<br/>
            If you didn't make this request then you can safely ignore this email or contact admin. <br/><br/>
            &mdash; ESG Team
          `;
          var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'testmailer09876@gmail.com',
              pass: 'ijsfupqcuttlpcez'
            }
          });
          
          transporter.sendMail({
            from: 'testmailer09876@gmail.com',
            to: user.email,
            subject: 'ESG - OTP',
            html: content
          });
          return res.send({ user: user.view(true) });
        } else{
          return res.send({ token: response, user: user.view(true) });
        }
      }
    });
}

export const loginOtp = async(req, res, next) => {
  sign(req.user.id)
    .then(async(token) => { 
      if (req.body.login) {
        let bodyData = Buffer.from(req.body.login, 'base64');
        let loginDetails = JSON.parse(bodyData);
        let userDetail = await User.findOne({ email: loginDetails.email });
        if (userDetail) {
          return res.status(200).json({ token: token, message: "OTP verified successfully!", user: userDetail.view(true) });
        } else {
          return res.status(401).json({ message: "Invalid OTP or Email!" })
        }        
      } else {
        return res.status(200).json({ token: token, message: "OTP verified successfully!" });
      }
    })
}

export const validateOTP = ({ body }, res, next) => {
  User.findOne({ email: body.email, otp: body.otp })
  .then((resp) => {
    if (resp) {
      return res.status(201).json({ message: "Validation success!" })
    } else {
      return res.status(401).json({ message: "Invalid OTP or Email!" })
    }
  })
}
