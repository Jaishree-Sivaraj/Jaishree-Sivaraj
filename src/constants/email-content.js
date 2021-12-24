'use strict';

// Email for onborading users.
export function onboardingEmailContent(data, type) {
    let subject;
    switch (type) {
        case 'LINK_TO_ONBOARD_USER':
            subject = 'ESGDS InfinData Platform Access form';
            return {
                subject,
                message: ` Hi,<br/><br/>
                Click on the link below or copy and paste it into a browser to submit your onboarding details:<br></br>
                <a href="${data}">${data}</a><br><br>
                Kindly contact us at support@esgds.ai in case you need any support.<br/><br/>          
                Regards,<br>
                ESGDS Support Team`
            };
        case 'FAILED_TO_ONBOARD':
            return `
              Hi,<br/><br/>
              Sorry, we could not process your onboarding request.<br/>
              Please find comment from the system administrator – ${data}.<br/><br/>    
              Kindly contact us at support@esgds.ai in case you need any support.<br/><br/>                 
              Thanks<br/>
              ESGDS Team `;

        case 'ACCESS_TO_LOGIN':
            subject = 'ESGDS InfinData Platform access enabled';
            return {
                subject,
                message: `Hi,<br/><br/>
                ou now have access to the ESGDS InfinData Platform.<br/>
                Kindly use your email id & the password set by you at the time of registration / on-boarding.<br/><br/><br/>
                Platform URL - <a href="${data}">${data}</a><br><br>       
                Kindly contact us at support@esgds.ai in case you need any support. <br/><br/>                  
                Thanks<br/>
                ESGDS Team `
            }

        default:
            return '';
    }
}

// Email to send OTP
export function otpEmail(name, otpNumber) {
    const subject = `OTP forESGDS InfinData Platform`;
    return {
        subject,
        message: `Hi ${name},<br/><br/>
                Please use the below OTP to login to ESGDS InfinData Platform.<br/>
                OTP - <b>${otpNumber}</b>.<br/>
                Kindly contact us at support@esgds.ai in case<br/>
                you have not requested for the OTP or if you <br/>
                need any further support.<br/><br/>
                Regards,<br/>
                ESGDS Support Team`
    }
}

// Email for Password reset.
export function passwordResetEmail(name, link) {
    const subject = 'Reset Password forESGDS InfinData Platform';
    return {
        subject,
        message: ` Hi ${name},<br><br>
                You requested for a password reset for your ESGDS InfinData Platform.<br>
                Click on the link below or copy and paste it into a browser to reset password
                This link will expire in 30 mins <br><br>
                <a href="${link}">click here</a><br><br>
                Kindly contact us at support@esgds.ai in case you have not requested for the
                password reset or if you need any support with <br>
                the password reset.
                <br><br>
                Regards,<br>
                ESGDS Support Team`
    }
}

// Email to Client and Company Representative after QA work on the error raised by the reps.
export function RepEmail(companyName, pillar, year) {


    return `Hi,<br><br>
            Please login into the data portal and check ${companyName},<br>
            ${pillar}, ${year} for our comments. <br><br>
            Please check the notifications within the system for additional details.<br>
            Kindly contact us at support@esgds.ai in case you need any support.<br><br>
            Regards,<br>
            ESGDS Support Team`
}

export function getEmailForJsonGeneration(companyName, year) {
    const subject = `${companyName} data uploaded on ESGDS InfinData Platform`;
    return {
        subject,
        message: `Hi,<br><br>
        We have updated data for the below company to which you have access. <br><br>
        ${companyName}<br>
        ${year}<br><br>
        Kindly login into the ESGDS InfinData Platform to review the data.<br><br>
        Kindly contact us at support@esgds.ai in case you need any support.<br><br>    
        Regards, <br>
        ThanksESGDS Team `}
}