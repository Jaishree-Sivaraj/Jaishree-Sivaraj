
import { JsonFiles } from '.'
import { CompaniesTasks } from "../companies_tasks";
import { Controversy } from "../controversy"
import { ControversyTasks } from "../controversy_tasks"
import * as AWS from 'aws-sdk'
import { DerivedDatapoints } from '../derived_datapoints'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { Companies } from '../companies'
var cron = require('node-cron');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    region: 'ap-south-1'
});

cron.schedule('0 3 * * saturday', () => {
    console.log('in cron job')
    handleCron();
});

async function handleCron() {
    var companiesTasks = await CompaniesTasks.find({ canGenerateJson: true, isJsonGenerated: false, status: true }).populate('categoryId').populate({
        path: 'companyId',
        populate: {
            path: 'clientTaxonomyId'
        }
    });
    console.log('companiesTasks', companiesTasks.length);
    var companiesTasksArr = [];
    companiesTasks.forEach(function (rec) {
        var obj = {};
        obj.companyId = rec.companyId.id;
        obj.year = rec.year;
        if (companiesTasksArr.findIndex((rec) => rec.companyId === obj.companyId && rec.year === obj.year) === -1) {
            companiesTasksArr.push(obj);
        }
    })
    var controversyTasks = await ControversyTasks.find({ canGenerateJson: true, isJsonGenerated: false, status: true }).populate({
        path: 'companyId',
        populate: {
            path: 'clientTaxonomyId'
        }
    });
    for (let index = 0; index < companiesTasksArr.length; index++) {
        console.log('index', index);
        try {
            var result = await generateJson({ type: 'data', companyId: companiesTasksArr[index].companyId, year: companiesTasksArr[index].year });
        } catch (e) {
            console.log('error while generating jsons for data', e);
        }
    }

    for (let index = 0; index < controversyTasks.length; index++) {
        try {
            var result = await generateJson({ type: 'controversy', companyId: controversyTasks[index].companyId.id });
        } catch (e) {
            console.log('error while generating jsons for controversy', e);
        }
    }
}
async function generateJson(body) {
    return new Promise(async function (resolve, reject) {
        if (body.type && body.type === 'data') {
            let companyID = body.companyId ? body.companyId : '';
            let companyDetails = await Companies.findById(companyID).populate('clientTaxonomyId');
            let requiredDataPoints = await Datapoints.find({ clientTaxonomyId: companyDetails.clientTaxonomyId.id, isRequiredForJson: true, functionId: { "$ne": '609bcceb1d64cd01eeda092c' }, status: true }).distinct('_id');
            let jsonResponseObject = {
                companyName: companyDetails.companyName ? companyDetails.companyName : '',
                companyID: companyDetails.cin ? companyDetails.cin : '',
                NIC_CODE: companyDetails.nicCode ? companyDetails.nicCode : '',
                NIC_industry: companyDetails.nicIndustry ? companyDetails.nicIndustry : '',
                fiscalYear: [
                    [
                        {
                            year: body.year,
                            Data: []
                        }
                    ]
                ]
            }
            await StandaloneDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: body.year, isActive: true, status: true, companyId: companyID }).populate('datapointId').then((result) => {
                if (result.length > 0) {
                    for (let index = 0; index < result.length; index++) {
                        const element = result[index];
                        let objectToPush = {
                            Year: element.year,
                            DPCode: element.datapointId.code,
                            Response: element.response,
                            PerformanceResponse: element.performanceResult
                        }
                        jsonResponseObject.fiscalYear[0][0].Data.push(objectToPush);
                    }
                }
            });
            await DerivedDatapoints.find({ datapointId: { "$in": requiredDataPoints }, year: body.year, status: true, companyId: companyID }).populate('datapointId').then((result) => {
                if (result.length > 0) {
                    for (let index = 0; index < result.length; index++) {
                        const element = result[index];
                        let objectToPush = {
                            Year: element.year,
                            DPCode: element.datapointId.code,
                            Response: element.response,
                            PerformanceResponse: element.performanceResult
                        }
                        jsonResponseObject.fiscalYear[0][0].Data.push(objectToPush);
                    }
                }
            });
            await storeFileInS3({ "message": "Success.", "status": 200, "data": jsonResponseObject }, 'data', body.companyId, body.year).then(async function (s3Data) {
                let jsonFileObject = {
                    companyId: companyID,
                    year: body.year,
                    url: s3Data.data.Location,
                    type: 'data',
                    fileName: s3Data.fileName,
                    status: true
                }
                await JsonFiles.updateOne({ companyId: companyID, year: body.year }, { $set: jsonFileObject }, { upsert: true })
                    .then(async (updatedJsonfiles) => {
                        await CompaniesTasks.updateMany({ companyId: companyID, year: body.year }, { $set: { canGenerateJson: false, isJsonGenerated: true } })
                            .then(async (updatedCompaniesTasks) => {
                                resolve(body.type.toUpperCase() + " Json generated successfully!")
                            }).catch(function (err) {
                                reject(err.message ? err.message : `errror while updating compines tasks `)
                            })
                    }).catch(function (err) {
                        reject(err.message ? err.message : `errror while updating compines tasks `)
                    })
            }).catch(function (err) {
                reject(err.message ? err.message : `errror while updating compines tasks `)
            });
        } else if (body.type && body.type === 'controversy') {
            let companyDetails = await Companies.findOne({ _id: body.companyId, status: true });
            if (companyDetails) {
                let controversyJsonDatapoints = await Datapoints.find({ clientTaxonomyId: companyDetails.clientTaxonomyId.id, functionId: { $eq: "609bcceb1d64cd01eeda092c" }, isRequiredForJson: true, status: true }).distinct('_id');
                let companyControversyYears = await Controversy.find({ companyId: body.companyId, datapointId: { $in: controversyJsonDatapoints }, isActive: true, status: true }).distinct('year');
                let responseObject = {
                    companyName: companyDetails.companyName,
                    CIN: companyDetails.cin,
                    data: [],
                    status: 200
                };
                if (companyControversyYears.length > 0) {
                    for (let yearIndex = 0; yearIndex < companyControversyYears.length; yearIndex++) {
                        let companyControversiesYearwise = await Controversy.find({ companyId: body.companyId, status: true })
                            .populate('createdBy')
                            .populate('companyId')
                            .populate('datapointId');
                        if (companyControversiesYearwise.length > 0) {
                            for (let index = 0; index < companyControversiesYearwise.length; index++) {
                                const element = companyControversiesYearwise[index];
                                let dataObject = {
                                    Dpcode: element.datapointId.code,
                                    Year: element.year,
                                    ResponseUnit: element.response,
                                    controversy: element.controversyDetails
                                }
                                responseObject.data.push(dataObject);
                            }
                        }
                    }
                }
                await storeFileInS3(responseObject, 'controversy', body.companyId).then(async function (s3Data) {
                    let jsonFileObject = {
                        companyId: body.companyId,
                        url: s3Data.data.Location,
                        type: 'controversy',
                        fileName: s3Data.fileName,
                        status: true
                    }
                    await JsonFiles.updateOne({ companyId: body.companyId }, { $set: jsonFileObject }, { upsert: true })
                        .then(async (updatedJsonfiles) => {
                            await ControversyTasks.updateOne({ companyId: body.companyId }, { $set: { canGenerateJson: false, isJsonGenerated: true } })
                                .then(async (updatedControversyTasks) => {
                                    resolve(body.type.toUpperCase() + " Json generated successfully!")
                                }).catch(function (err) {
                                    reject(err.message ? err.message : `errror while updating compines tasks `)
                                })
                        }).catch(function (err) {
                            reject(err.message ? err.message : `errror while updating compines tasks `)
                        })
                }).catch(function (err) {
                    reject(err.message ? err.message : `errror while updating compines tasks `)
                });
            }
        } else {
            reject('Type should be either data or controversy');
        }
    })
}


async function storeFileInS3(actualJson, type, companyId, year) {
    return new Promise(function (resolve, reject) {
        var fileName = `${companyId}_${year ? year + '_' : ''}${Date.now()}.json`;
        console.log('filName', fileName);
        const params = {
            Bucket: process.env.JSON_FILES_BUCKET_NAME, // pass your bucket name
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

