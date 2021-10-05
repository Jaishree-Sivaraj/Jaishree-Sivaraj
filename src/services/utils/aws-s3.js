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
            const myBucket = bucketName
            const myKey = keyName;
            const signedUrlExpireSeconds = 60 * 10 // your expiry time in seconds.
            console.log(myBucket, myKey)
            const headCode = await s3.headObject({ Bucket: myBucket, Key: myKey }).promise();
            const url = s3.getSignedUrl('getObject', {
                Bucket: myBucket,
                Key: myKey,
                Expires: signedUrlExpireSeconds
            })
            resolve(url);
        } catch (headErr) {
            console.log('headErr', headErr)
            const signedUrlExpireSeconds = 60 * 10;
            if (headErr.code === 'NotFound') {
                const noImageurl = s3.getSignedUrl('getObject', {
                    Bucket: bucketName,
                    Key: "no-image.jpg",
                    Expires: signedUrlExpireSeconds
                })
                resolve(noImageurl);
            } else {
                console.log('in else catch')
                reject("error")
            }
        }
    })
}

module.exports = { storeFileInS3, fetchFileFromS3 }