import { success, notFound } from '../../services/response/'
import { sendMail } from '../../services/sendgrid'
import nodemailer from 'nodemailer'
import { PasswordReset } from '.'
import { User } from '../user'

export const create = async({ bodymen: { body: { email } } }, res, next) => {
  User.findOne({ email })
    .then(async (user) => {
      if (user) {
        PasswordReset.create({ user })
        .then((reset) => {
          if (!reset) return res.status(400).json({ status: "400", message: 'Failed to send password reset mail!' })
          const { user, token } = reset
          let Link = `${process.env.FRONTEND_URL}/password-resets`;
          Link = `${Link.replace(/\/$/, '')}/${token}`
          const content = `
            Hey, ${user.name}.<br><br>
            You requested for a new password for your ESG API account.<br>
            Please use the below link to set a new password. The link will expire in 1 hour.<br><br>
            <a href="${Link}">click here</a><br><br>
            Kindly contact your system administrator if you have not raised this request.<br><br>
            Thanks<br>
            ESG API Team
          `
          var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'testmailer09876@gmail.com',
              pass: 'ijsfupqcuttlpcez'
            }
          });
          
          transporter.sendMail({
            from: 'testmailer09876@gmail.com',
            to: email,
            subject: 'esgapi - Password Reset',
            html: content.toString()
          });
          return res.status(200).json({ status: "200", message: "Email sent successfully!" })
        })
        .catch((error) => {
          return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to send password reset mail!' })
        })
      } else {
        return res.status(400).json({ status: "400", message: "Email not registered with ESG!" })
      }
    })
}

export const show = ({ params: { token } }, res, next) =>
  PasswordReset.findOne({ token })
    .populate('user')
    .then(notFound(res))
    .then((reset) => reset ? reset.view(true) : null)
    .then(success(res))
    .catch(next)

export const update = ({ params: { token }, bodymen: { body: { password } } }, res, next) => {
  PasswordReset.findOne({ token })
    .populate('user')
    .then((reset) => {
      if (!reset) return res.status(400).json({ status: "400", message: 'Failed to reset password, please try again!' })
      const { user } = reset
      user.set({ password }).save()
        .then(() => {
          PasswordReset.deleteMany({ user }).then(() => {
            return res.status(200).json({ status: "200", message: "Password reset successful!", data: user ? user.view(true) : null });
          })
          .catch((err) => {
            return res.status(400).json({ "status": "400", message: err.message ? err.message : 'Failed to reset password' })
          })
        })
        .catch((err) => {
          return res.status(400).json({ "status": "400", message: err.message ? err.message : 'Failed to reset password' })
        })
    })
    .catch((err) => {
      return res.status(400).json({ "status": "400", message: err.message ? err.message : 'Invalid password reset token!' })
    })
}
