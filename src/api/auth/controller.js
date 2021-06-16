import nodemailer from 'nodemailer'
import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import { User } from '../user'

export const login = ({ user }, res, next) => {
  sign(user.id)
  .then((token) => ({ token, user: user.view(true) }))
    .then((response) => {
      console.log('user response', response);
      if(response.user){
        if(response.user.roleId.roleName == 'SuperAdmin'){
          //Generating 4 digit random number for OTP
          let otpNumber = Math.floor(1000 + Math.random() * 9000);
          console.log('otpNumber', otpNumber);
          //update the otp value in user data
          let updateObject = { otp: otpNumber ? otpNumber : '' };
          User.updateOne({ _id: response.user.id }, 
            { 
              $set: updateObject
            }, function(err, updatedUser) {
              console.log('updatedUser', updatedUser);
            }
          );

          //nodemail code will come here to send OTP
          const content = `
            Hey, ${response.user.name}.<br/><br/>
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
            to: response.user.email,
            subject: 'ESG - OTP',
            html: content
          });
          return res.send({ token: response.token, user: response.user });
        }
         else{
          return res.send({ token: response.token, user: response.user });
        }
      }
    });
}

export const loginOtp = ({ user }, res, next) =>
  sign(user.id)
    .then((token) => ({ token, user: user.view(true) }))
    .then(success(res, 201))
    .catch(next)

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
