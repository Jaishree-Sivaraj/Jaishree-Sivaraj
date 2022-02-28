import { Companies } from '../companies';
import { ClientRepresentatives } from '../client-representatives';
import { Controversy } from '../controversy';
import { notifyControJsonUpdated } from '../../constants/email-content';
var cron = require('node-cron');

//scheduling a job, daily once using cron
cron.schedule('00 22 * * *', () => {
    console.log('in cron job')
    notifyControJsonUpdates();
});

async function notifyControJsonUpdates() {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let updatedCompanyIds = await Controversy.find({ status: true, isActive: true, createdAt: { $gt: yesterday } }).distinct('companyId');
    let companyListWithDetails = await Companies.find({ _id: { $in: updatedCompanyIds } });
    let customArray = [];

    for(let i=0;i<companyListWithDetails.length;i++){
        let availableClientRepsOfThisCompany = await ClientRepresentatives.find({companiesList: { $in: companyListWithDetails[i] }}).populate('userId');
        for(let j=0;j<availableClientRepsOfThisCompany.length;j++){
            let objectToPushCustomArray = {
                "userId": availableClientRepsOfThisCompany[j].userId.id,
                "email": availableClientRepsOfThisCompany[j].userId.email,
                "companies": [companyListWithDetails[i].companyName]
            }
            if(customArray.length > 0){
                let foundIndex = customArray.findIndex((obj, index) => obj.userId == objectToPushCustomArray.userId);
                if(foundIndex > -1){
                    let responseIndex = customArray.findIndex((obj, index) => obj.userId == objectToPushCustomArray.userId && obj.companies.includescompanyListWithDetails[i].companyName);
                    if(responseIndex < 0){
                        //only push the new company name to the existing object of the rep-user id
                        customArray[responseIndex].companies.push(companyListWithDetails[i].companyName)
                    }
                } else {
                    //push the new object into customArray
                    customArray.push(objectToPushCustomArray);
                }
            } else {
                customArray.push(objectToPushCustomArray);
            }
        }
    }

    //At last we will get an array similar to this
    //customArray = [{"userId": "123", "email": "123@gmail.com", "companies": ["A-Company"]}, {"userId": "456", "email": "456@gmail.com", "companies": ["A-Company", "B-Company"]}, {"userId": "789", "email": "789@gmail.com", "companies": ["A-Company", "B-Company", "C-Company"] },{"userId": "101112", "email": "101112@gmail.com", "companies": ["B-Company", "C-Company"] }];

    //iterate all users one by one
    for(let k=0;k<customArray.length;k++){
        let toMailAddress = customArray[k]?.email;
        //send mail only in production
        //for testing developer can remove the below condition
        if (process.env.NODE_ENV === 'production') {
            const mailContent = notifyControJsonUpdated(customArray.companies);
            await sendEmail(toMailAddress, mailContent.subject, mailContent.message)
            .then((resp) => { console.log('Mail sent!'); });
        }
    }
}