import * as AWS from 'aws-sdk'
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    region: 'ap-south-1'
});

async function storeFileInS3(data, companyId, dataPointId, year, bucketName) {
    return new Promise(function (resolve, reject) {
        var fileName = `${companyId}_${year ? year + '_' : ''}${Date.now()}.json`;
        console.log('filName', fileName);
        const params = {
            Bucket: process.env.BUCKET_NAME, // pass your bucket name 
            Key: type + '/' + fileName, // file will be saved in <folderName> folder
            Body: Buffer.from(JSON.stringify(actualJson))
        };
        s3.upload(params, function (s3Err, data) {
            if (s3Err) {
                console.log('s3', s3Err);
                reject(s3Err)
            } else {
                resolve({ data, fileName: type + '/' + fileName });
            }
        });
    })
}

module.exports = { storeFileInS3 }