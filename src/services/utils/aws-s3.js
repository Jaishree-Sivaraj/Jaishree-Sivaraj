import * as AWS from 'aws-sdk'
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    region: 'ap-south-1'
});

async function storeFileInS3(bucketName, fileName, fileDataBase64) {
    const bufferData = new Buffer.from(fileDataBase64.split(';base64,')[1], 'base64');
    return new Promise(function (resolve, reject) {
        const params = {
            Bucket: bucketName, // pass your bucket name 
            Key: fileName, // file will be saved in <folderName> folder
            Body: bufferData
        };
        s3.upload(params, function (s3Err, data) {
            if (s3Err) {
                reject(s3Err)
            } else {
                resolve({ data, fileName });
            }
        });
    })
}

async function fetchFileFromS3(bucketName, keyName) {
    return new Promise(async function (resolve, reject) {
        try {
            var myBucket = bucketName
            var myKey = keyName;
            var signedUrlExpireSeconds = 60 * 10 // your expiry time in seconds.
            console.log(myBucket, myKey)
            var headCode = await s3.headObject({ Bucket: myBucket, Key: myKey }).promise();
            var url = s3.getSignedUrl('getObject', {
                Bucket: myBucket,
                Key: myKey,
                Expires: signedUrlExpireSeconds
            })
            resolve(url);
        } catch (headErr) {
            console.log('headErr', headErr)
            var myBucket = bucketName;
            var signedUrlExpireSeconds = 60 * 10;
            console.log('myBucket', myBucket, keyName);
            if (headErr.code === 'NotFound') {
                var noImageurl = s3.getSignedUrl('getObject', {
                    Bucket: myBucket,
                    Key: "no-image.jpg",
                    Expires: signedUrlExpireSeconds
                })
                console.log('noImageurl', noImageurl);
                resolve(noImageurl);
            } else {
                console.log('in else catch')
                reject("error")
            }
        }
    })
}

module.exports = { storeFileInS3, fetchFileFromS3 }