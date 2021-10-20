import jwt from 'jsonwebtoken'
import { Strategy as JwtStrategy } from 'passport-jwt'
import nodemailer from 'nodemailer'
import { sign, verify } from '../../services/jwt'
import { success } from '../../services/response/'
import { jwtSecret, masterKey } from '../../config'
import { User } from '../user'
import { Role } from '../role'

export const login = async ({ user }, res, next) => {
  sign(user.id)
    .then(async (response) => {
      console.log('user ' + user)
      if (user) {
        let superAdminRoleDetails = await Role.findOne({ roleName: "SuperAdmin" }).catch(() => { return res.status(500).json({ status: "500", message: error.message }) });
        let adminRoleDetails = await Role.findOne({ roleName: "Admin" }).catch(() => { return res.status(500).json({ status: "500", message: error.message }) });
        let userDetailType1 = await User.findOne({
          _id: user.id,
          isUserActive: true,
          isUserApproved: true,
          status: true,
          '$or': [{
            'roleDetails.roles': { '$in': [superAdminRoleDetails.id] }
          }, { 'roleDetails.primaryRole': superAdminRoleDetails.id }]
        }).populate({ path: 'roleDetails.roles' }).
          populate({ path: 'roleDetails.primaryRole' }).catch((error) => { return res.status(500).json({ "status": "500", message: error.message }) });

        let userDetailType2 = await User.findOne({
          _id: user.id,
          isUserActive: true,
          isUserApproved: true,
          status: true,
          '$or': [{
            'roleDetails.roles': { '$in': [adminRoleDetails.id] }
          }, { 'roleDetails.primaryRole': adminRoleDetails.id }]
        }).populate({ path: 'roleDetails.roles' }).
          populate({ path: 'roleDetails.primaryRole' }).catch((error) => { return res.status(500).json({ "status": "500", message: error.message }) });
        var otpNumber;
        if (process.env.NODE_ENV === 'production') {
          otpNumber = Math.floor(1000 + Math.random() * 9000);
        } else {
          if (userDetailType1 || userDetailType2) {
            otpNumber = '4321';
          } else {
            otpNumber = '1234';
          }
        }
        //Generating 4 digit random number for OTP
        //update the otp value in user data
        let updateObject = { otp: otpNumber ? otpNumber : '' };
        User.updateOne({ _id: user.id },
          {
            $set: updateObject
          }, function (err, updatedUser) {
            console.log('updatedUser', updatedUser);
          }
        );

        //nodemail code will come here to send OTP
        if (process.env.NODE_ENV === 'production') {
          const content = `
            Hi ${user.name},<br/><br/>
            Please use the below OTP to login into your ESG API account.<br/>
            OTP - <b>${otpNumber}</b>.<br/>
            Kindly contact your system administrator if you have not raised this request.<br/><br/>
            Thanks<br/>
            ESG API Team
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
        }
        return res.send({ status: "200", message: "Otp sent to registered email" });
        // } else {
        //   let userDetail = await User.findOne({
        //     _id: user.id,
        //     isUserActive: true,
        //     isUserApproved: true,
        //     status: true
        //   }).populate({ path: 'roleDetails.roles' }).
        //     populate({ path: 'roleDetails.primaryRole' });
        //   if (userDetail && Object.keys(userDetail).length > 0) {
        //     userDetail = userDetail.toObject();
        //     delete userDetail.password;
        //     userDetail.roleDetails = {
        //       "role": userDetail.roleDetails.roles.length > 0 ? userDetail.roleDetails.roles.map((rec1) => {
        //         return { value: rec1._id, label: rec1.roleName }
        //       }) : [],
        //       "primaryRole": { value: userDetail.roleDetails.primaryRole ? userDetail.roleDetails.primaryRole._id : null, label: userDetail.roleDetails.primaryRole ? userDetail.roleDetails.primaryRole.roleName : null }
        //     }
        //     return res.send({ message: "Login successful!", status: "200", token: response, user: userDetail });
        //   } else {
        //     return res.send({ message: "User don't have access, please contact admin!", status: "401" });
        //   }
        // }
      }
    });
}

export const loginOtp = async (req, res, next) => {
  sign(req.user.id)
    .then(async (token) => {
      if (req.body) {
        let userDetail = await User.findOne({ email: req.body.email, isUserActive: true, isUserApproved: true, status: true }).populate({ path: 'roleDetails.roles' }).
          populate({ path: 'roleDetails.primaryRole' });
        if (userDetail) {
          userDetail = userDetail.toObject();
          delete userDetail.password;
          userDetail.roleDetails = {
            "role": userDetail.roleDetails.roles.length > 0 ? userDetail.roleDetails.roles.map((rec1) => {
              return { value: rec1._id, label: rec1.roleName }
            }) : [],
            "primaryRole": { value: userDetail.roleDetails.primaryRole ? userDetail.roleDetails.primaryRole._id : null, label: userDetail.roleDetails.primaryRole ? userDetail.roleDetails.primaryRole.roleName : null }
          }
          return res.status(200).json({ token: token, message: "Login successful!", user: userDetail });
        } else {
          return res.status(401).json({ status: "401", message: "Authorization Failed!" })
        }
      } else {
        return res.status(200).json({ token: token, message: "Login successful!" });
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
