import nodemailer from 'nodemailer'

async function sendEmail(toAddress, subject, body) {
    
    if (process.env.NODE_ENV != 'development') {
        return new Promise(function (resolve, reject) {
            var transporter = nodemailer.createTransport({
                host: 'smtppro.zoho.in',
                port: 587,
                tls: { 
                    rejectUnauthorized: false 
                },
                auth: {
                    user: process.env.NODE_MAIL_USER,
                    pass: process.env.NODE_MAIL_PASSWORD
                }
            });
            let mailOptions = {
                from: process.env.NODE_MAIL_DISPLAY_NAME,
                to: toAddress,
                subject: subject,
                html: body
            }
            transporter.sendMail(mailOptions, function(err, info) {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    }
}
module.exports = { sendEmail }