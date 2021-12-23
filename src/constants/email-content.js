'use strict';

// Email for onborading users.
export function onboardingEmailContent(data, type) {
    switch (type) {
        case 'LINK_TO_ONBOARD_USER':
            return `
            Hi,<br/><br/>
                Please click on the link below or copy and paste it into a browser to submit your onboarding details:<br/><br/>
                <a href="${data}">click here</a><br><br>
                Kindly contact us at support@esgds.ai in case you need any support.<br/><br/>          
                Regards,<br>
                ESGDS Support Team`;
        case 'FAILED_TO_ONBOARD':
            return `
              Hi,<br/><br/>
              Sorry, we could not process your onboarding request.<br/>
              Please find comment from the system administrator – ${data}.<br/><br/>    
              Kindly contact us at support@esgds.ai in case you need any support.<br/><br/>                 
              Thanks<br/>
              ESGDS Team `;

        case 'ACCESS_TO_LOGIN':
            return `Hi,<br/><br/>
                You now have access to the ESGDS data portal.<br/>
                Kindly use your email id & the password set by you at the time of filing the form to login into the system.<br/><br/><br/>
                Link - <a href="${data}">click here</a><br><br>       
                Kindly contact your system administrator/company representative incase of any questions.<br/><br/>                  
                Thanks<br/>
                ESGDS Team `

        default:
            return '';
    }

}



// Email to send OTP
export function otpEmail(name, otpNumber) {
    return `Hi ${name},<br/><br/>
                Please use the below OTP to login to ESGDS InfinData Platform.<br/>
                OTP - <b>${otpNumber}</b>.<br/>
                Kindly contact us at support@esgds.ai in case<br/>
                you have not requested for the OTP or if you <br/>
                need any further support.<br/><br/>
                Regards,<br/>
                ESGDS Support Team
  `;
}

// Email for Password reset.
export function passwordResetEmail(name, link) {
    return ` Hi ${name},<br><br>
                You requested for a password reset for your ESGDS InfinData Platform.<br>
                Click on the link below or copy and paste it into a browser to reset password.<br>
                This link will expire in 30 mins <br><br>
                <a href="${link}">click here</a><br><br>
                Kindly contact us at support@esgds.ai in case you have not requested <br>
                for the password reset or if you need any support with the password reset<br><br>
                Regards,<br>
                ESGDS Support Team
  `;
}

// Email to Client and Company Representative after QA work on the error raised by the reps.
export function RepEmail(companyName, pillar, year) {
    return `Hi,
            Please login into the data portal and check ${companyName},
            ${pillar}, ${year} for our comments .
            Please check the notifications within the system for additional details.
            Kindly contact us at support@esgds.ai in case you need any support.
            Regards,<br>
            ESGDS Support Team`;
}

export function getEmailForJsonGeneration(companyName,year){
    return `
        Hi,
        We have updated data for ${companyName} for the years ${year}
        which you have access. 
        Kindly login into the portal to review the data.
        Please contact support@esgds.com incase of any issues.

        ThanksESGDS Team `
}