import { success, notFound } from '../../services/response/'
import { sendMail } from '../../services/sendgrid'
import nodemailer from 'nodemailer'
import { PasswordReset } from '.'
import { User } from '../user'
import { sendEmail } from "../../services/utils/mailing"
import { passwordResetEmail } from '../../constants/email-content';

export const create = async ({ bodymen: { body: { email } } }, res, next) => {
  User.findOne({ email })
    .then(async (user) => {
      if (user) {
        PasswordReset.create({ user })
          .then(async (reset) => {
            if (!reset) return res.status(400).json({ status: "400", message: 'Failed to send password reset mail!' })
            const { user, token } = reset
            let link = `${process.env.FRONTEND_URL}/password-resets`;
            link = `${link.replace(/\/$/, '')}/${token}`
            const emailDetails = passwordResetEmail(user.name, link)
            // var transporter = nodemailer.createTransport({
            //   service: 'Gmail',
            //   auth: {
            //     user: 'testmailer09876@gmail.com',
            //     pass: 'ijsfupqcuttlpcez'
            //   }
            // });

            // transporter.sendMail({
            //   from: 'testmailer09876@gmail.com',
            //   to: email,
            //   subject: 'ESGAPI - Password Reset',
            //   html: content.toString()
            // });
            if (process.env.NODE_ENV === 'production') {
              await sendEmail(email, emailDetails.subject, emailDetails.message)
                .then((resp) => { console.log('Mail sent!'); });
              return res.status(200).json({ status: "200", message: "Email sent successfully!" })
            }
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

export const testMail = async (req, res, next) => {
  if (req.query.mailId != '' && req.query.mailId, req.query.mailId.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      await sendEmail(req.query.mailId, 'New Test Mail', '<b>Test generic zoho html mail</b>').then((resp) => {
        console.log('resp', resp);
        if (resp) {
          return res.json({ status: "200", message: "Mail sent successfully!" })
        } else {
          return res.json({ status: "400", message: "Failed to send mail!" })
        }
      });
    }
  }
}
