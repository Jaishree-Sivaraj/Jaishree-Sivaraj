import { success, notFound } from '../../services/response/'
import { sendMail } from '../../services/sendgrid'
import nodemailer from 'nodemailer'
import { PasswordReset } from '.'
import { User } from '../user'

export const create = ({ bodymen: { body: { email, link } } }, res, next) =>
  User.findOne({ email })
    .then(notFound(res))
    .then((user) => user ? PasswordReset.create({ user }) : null)
    .then((reset) => {
      if (!reset) return null
      const { user, token } = reset
      link = `${link.replace(/\/$/, '')}/${token}`
      const content = `
        Hey, ${user.name}.<br><br>
        You requested a new password for your esgapi account.<br>
        Please use the following link to set a new password. It will expire in 1 hour.<br><br>
        <a href="${link}">click here</a><br><br>
        If you didn't make this request then you can safely ignore this email. :)<br><br>
        &mdash; esgapi Team
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
      return res.send({ status: "200", message: "Email sent successfully!" })
    })
    .then((response) => {
      console.log('response', response);
      response ? res.json(response).end() : null 
    })
    .catch(next)

export const show = ({ params: { token } }, res, next) =>
  PasswordReset.findOne({ token })
    .populate('user')
    .then(notFound(res))
    .then((reset) => reset ? reset.view(true) : null)
    .then(success(res))
    .catch(next)

export const update = ({ params: { token }, bodymen: { body: { password } } }, res, next) => {
  return PasswordReset.findOne({ token })
    .populate('user')
    .then(notFound(res))
    .then((reset) => {
      if (!reset) return null
      const { user } = reset
      return user.set({ password }).save()
        .then(() => PasswordReset.deleteMany({ user }))
        .then(() => user.view(true))
    })
    .then(success(res))
    .catch(next)
}
