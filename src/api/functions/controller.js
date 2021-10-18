import validUrl from 'valid-url'
import _ from 'lodash';
import moment from 'moment'
import puppeteer from "puppeteer";
import axios from 'axios';
import fs from "fs"
import path from 'path';
import * as AWS from 'aws-sdk'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { success, notFound } from '../../services/response/'
import { Functions } from '.'
import { StandaloneDatapoints } from "../standalone_datapoints"
import { BoardMembersMatrixDataPoints } from "../boardMembersMatrixDataPoints"
import { KmpMatrixDataPoints } from "../kmpMatrixDataPoints"
import { CompanySources } from "../companySources"
import { Controversy } from "../controversy"
import { Companies } from "../companies"
import { Datapoints } from "../datapoints"

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'ap-south-1'
});

export const create = ({ bodymen: { body } }, res, next) =>
  Functions.create(body)
    .then((functions) => functions.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Functions.count(query)
    .then(count => Functions.find(query, select, cursor)
      .then((functions) => ({
        count,
        rows: functions.map((functions) => functions.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Functions.findById(params.id)
    .then(notFound(res))
    .then((functions) => functions ? functions.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  Functions.findById(params.id)
    .then(notFound(res))
    .then((functions) => functions ? Object.assign(functions, body).save() : null)
    .then((functions) => functions ? functions.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Functions.findById(params.id)
    .then(notFound(res))
    .then((functions) => functions ? functions.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const updateSourceUrls = async ({ params }, res, next) => {
  if (params.id == 'Standalone') {
    var standAlonepoints = await StandaloneDatapoints.find({ isCounted: false, isActive : true, status: true, url: { $exists: true, $nin: ["", " ", "`", "NA"] } }).limit(2000);
    let standAlonepointsList = _.uniqBy(standAlonepoints, 'url');
    console.log('uniq urls length ==>', standAlonepointsList.length);
    //launch
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (let index = 0; index < standAlonepointsList.length; index++) {
      let url = '';
      if (standAlonepointsList[index] && standAlonepointsList[index].url) {
        url = standAlonepointsList[index].url;
      }
      if (standAlonepointsList[index]) {
        let link = standAlonepointsList[index].url ? standAlonepointsList[index].url.trim() : '';
        console.log('link===>', link);
        let urlResult = false;
        await validUrl.isUri(link, function (err, exists) {
          urlResult = exists;
        });
        await validUrl.isHttpUri(link, function (err, exists) {
          urlResult = exists;
        });
        await validUrl.isHttpsUri(link, function (err, exists) {
          urlResult = exists;
        });
        await validUrl.isWebUri(link, function (err, exists) {
          urlResult = exists;
        });
        if (!urlResult) {
          let validationResult = await validateURL(link);
          if (!validationResult) {
            link = "http://" + link;
            let httpValidationResult = await validUrl.isUri(link);
            if (!httpValidationResult) {
              link = "https://" + link;
              let httpsValidationResult = await validUrl.isUri(link);
              if (!httpsValidationResult) {
                await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
              } else {
                try {
                  let matchingRecords = await StandaloneDatapoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  await page.goto(link);
                  let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
                  console.log('actualfile', actualFile);
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject1', s3FileObject);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                    .catch((error) => { 
                      console.log('1', error.message); 
                    })
                  }
                  await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                } catch (e) {
                  if (path.extname(link).includes('.pdf')) {
                    await axios({
                      method: "get",
                      url: link,
                      responseType: "stream"
                    }).then(async function (resp) {
                      let matchingRecords = await StandaloneDatapoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                      console.log('matchingRecords length', matchingRecords.length);
                      let fileName = '', publicationDate = '', fiscalYear = '';
                      if (matchingRecords.length > 0) {
                        fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                        try {
                          publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                        } catch (error) {
                          publicationDate = new Date();
                        }
                        fiscalYear = matchingRecords[0].year;
                      } else {
                        fileName = 'cmp_source_' + index + 1;
                      }
                      let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                      let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                      console.log('s3FileObject2', s3FileObject);
                      if (matchingRecords.length > 0) {
                        await CompanySources.create({
                          companyId: matchingRecords[0].companyId.id,
                          sourceTypeId: null,
                          sourceSubTypeId: null,
                          isMultiYear: false,
                          isMultiSource: false,
                          sourceUrl: link,
                          sourceFile: fileName,
                          publicationDate: publicationDate,
                          fiscalYear: fiscalYear,
                          name: 'cmp_source' + index + 1,
                          newSourceTypeName: '',
                          newSubSourceTypeName: '',
                          status: true
                        })
                        .catch((error) => { 
                          console.log('2', error.message); 
                        })
                      }
                      await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                      for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                        let recordObject = matchingRecords[recordsIndex];
                        if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                          await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                            $set: {
                              sourceName1: 'cmp_source' + (recordsIndex + 1),
                              sourceFile: s3FileObject.Key
                            }
                          });
                        }
                      }
                    })
                      .catch(async (error) => {
                        await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                      });
                  } else {
                    try {
                      await page.goto(link);
                      let matchingRecords = await StandaloneDatapoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                      console.log('matchingRecords length', matchingRecords.length);
                      let fileName = '', publicationDate = '', fiscalYear = '';
                      if (matchingRecords.length > 0) {
                        fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                        try {
                          publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                        } catch (error) {
                          publicationDate = new Date();
                        }
                        fiscalYear = matchingRecords[0].year;
                      } else {
                        fileName = 'cmp_source_' + index + 1;
                      }
                      let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                      let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                      console.log('s3FileObject3', s3FileObject);
                      if (matchingRecords.length > 0) {
                        await CompanySources.create({
                          companyId: matchingRecords[0].companyId.id,
                          sourceTypeId: null,
                          sourceSubTypeId: null,
                          isMultiYear: false,
                          isMultiSource: false,
                          sourceUrl: link,
                          sourceFile: fileName,
                          publicationDate: publicationDate,
                          fiscalYear: fiscalYear,
                          name: 'cmp_source' + index + 1,
                          newSourceTypeName: '',
                          newSubSourceTypeName: '',
                          status: true
                        })
                        .catch((error) => { 
                          console.log('3', error.message); 
                        })
                      }
                      await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                      for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                        let recordObject = matchingRecords[recordsIndex];
                        if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                          await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                            $set: {
                              sourceName1: 'cmp_source' + (recordsIndex + 1),
                              sourceFile: s3FileObject.Key
                            }
                          });
                        }
                      }
                    } catch (err) {
                      await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                    }
                  }
                }
              }
            } else {
              try {
                await page.goto(link);
                let matchingRecords = await StandaloneDatapoints.find({ url: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                console.log('s3FileObject4', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                  .catch((error) => { 
                    console.log('4', error.message); 
                  })
                }
                await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              } catch (e) {
                if (path.extname(link).includes('.pdf')) {
                  await axios({
                    method: "get",
                    url: link,
                    responseType: "stream"
                  }).then(async function (resp) {
  
                    let matchingRecords = await StandaloneDatapoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                    console.log('matchingRecords length', matchingRecords.length);
                    let fileName = '', publicationDate = '', fiscalYear = '';
                    if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                        publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                        publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                    } else {
                      fileName = 'cmp_source_' + index + 1;
                    }
                    let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                    let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                    console.log('s3FileObject5', s3FileObject);
                    if (matchingRecords.length > 0) {
                      await CompanySources.create({
                        companyId: matchingRecords[0].companyId.id,
                        sourceTypeId: null,
                        sourceSubTypeId: null,
                        isMultiYear: false,
                        isMultiSource: false,
                        sourceUrl: link,
                        sourceFile: fileName,
                        publicationDate: publicationDate,
                        fiscalYear: fiscalYear,
                        name: 'cmp_source' + index + 1,
                        newSourceTypeName: '',
                        newSubSourceTypeName: '',
                        status: true
                      })
                      .catch((error) => { 
                        console.log('5', error.message); 
                      })
                    }
                    await StandaloneDatapoints.updateMany({ url: url,isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                    for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                        await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                          $set: {
                            sourceName1: 'cmp_source' + (recordsIndex + 1),
                            sourceFile: s3FileObject.Key
                          }
                        });
                      }
                    }
                  })
                    .catch(async (error) => {
                      await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                    });
                } else {
                  try {
                    await page.goto(link);
                    let matchingRecords = await StandaloneDatapoints.find({ url: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
                    console.log('matchingRecords length', matchingRecords.length);
                    let fileName = '', publicationDate = '', fiscalYear = '';
                    if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                        publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                        publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                    } else {
                      fileName = 'cmp_source_' + index + 1;
                    }
                    let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                    let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                    console.log('s3FileObject6', s3FileObject);
                    if (matchingRecords.length > 0) {
                      await CompanySources.create({
                        companyId: matchingRecords[0].companyId.id,
                        sourceTypeId: null,
                        sourceSubTypeId: null,
                        isMultiYear: false,
                        isMultiSource: false,
                        sourceUrl: link,
                        sourceFile: fileName,
                        publicationDate: publicationDate,
                        fiscalYear: fiscalYear,
                        name: 'cmp_source' + index + 1,
                        newSourceTypeName: '',
                        newSubSourceTypeName: '',
                        status: true
                      })
                      .catch((error) => { 
                        console.log('6', error.message); 
                      })
                    }
                    await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                    for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                        await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                          $set: {
                            sourceName1: 'cmp_source' + (recordsIndex + 1),
                            sourceFile: s3FileObject.Key
                          }
                        });
                      }
                    }
                  } catch (err) {
                    await StandaloneDatapoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                  }
                }
              }
            }
          } else {
            try {
              await page.goto(link);
              let matchingRecords = await StandaloneDatapoints.find({ url: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_' + index + 1;
              }
              let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject7', s3FileObject);
              if (matchingRecords.length > 0) {
                await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                })
                .catch((error) => { 
                  console.log('7', error.message); 
                })
              }
              await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                    $set: {
                      sourceName1: 'cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                    }
                  });
                }
              }
            } catch (e) {
              if (path.extname(link).includes('.pdf')) {
                await axios({
                  method: "get",
                  url: link,
                  responseType: "stream"
                }).then(async function (resp) {
  
                  let matchingRecords = await StandaloneDatapoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  console.log('resp.data', resp.data);
                  // let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                  let actualFile = resp.data;
                  console.log('actualFile', actualFile);
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject8', s3FileObject);
                  console.log('matchingRecords.length', matchingRecords.length);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: s3FileObject.Key,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                    .catch((error) => { 
                      console.log('8', error.message); 
                    });
                  }
                  await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    console.log('inside for loop8');
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      console.log('inside if block8');
                      await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                })
                  .catch(async (error) => {
                    await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
                  });
              } else {
                try {
                  await page.goto(link);
                  let matchingRecords = await StandaloneDatapoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                  console.log('s3FileObject9', s3FileObject);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                    .catch((error) => { 
                      console.log('9', error.message); 
                    });
                  }
                  await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                } catch (err) {
                  await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
                }
              }
            }
          }
        } else {
          try {
            await page.goto(link);
            let matchingRecords = await StandaloneDatapoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
            console.log('matchingRecords length', matchingRecords.length);
            let fileName = '', publicationDate = '', fiscalYear = '';
            if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
                publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
            } else {
              fileName = 'cmp_source_' + index + 1;
            }
            let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
            let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
            console.log('s3FileObject10', s3FileObject);
            if (matchingRecords.length > 0) {
              await CompanySources.create({
                companyId: matchingRecords[0].companyId.id,
                sourceTypeId: null,
                sourceSubTypeId: null,
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index + 1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              })
              .catch((error) => { 
                console.log('10', error.message); 
              });            
            }
            await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
            for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                  $set: {
                    sourceName1: 'cmp_source' + (recordsIndex + 1),
                    sourceFile: s3FileObject.Key
                  }
                });
              }
            }
          } catch (e) {
            if (path.extname(link).includes('.pdf')) {
              await axios({
                method: "get",
                url: link,
                responseType: "stream"
              }).then(async function (resp) {
  
                let matchingRecords = await StandaloneDatapoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = resp.data;
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                console.log('s3FileObject11', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                  .catch((error) => {
                    console.log('11', error.message);
                  })
                }
                await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              })
                .catch(async (error) => {
                  await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
                });
            } else {
              try {
                await page.goto(link);
  
                let matchingRecords = await StandaloneDatapoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                console.log('s3FileObject12', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                  .catch((error) => {
                    console.log('12', error.message);
                  })
                }
                await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await StandaloneDatapoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              } catch (err) {
                await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
              }
            }
          }
        }
      } else {
        await StandaloneDatapoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
      }
    }
    await browser.close();
    return res.status(200).json({ status: "200", message: "Completed successfully!" });
  } else if(params.id == 'Board') {
    var standAlonepoints = await BoardMembersMatrixDataPoints.find({ isCounted: false, isActive : true, status: true, url: { $exists: true, $nin: ["", " ", "`", "NA"] } }).limit(2000);
    let standAlonepointsList = _.uniqBy(standAlonepoints, 'url');
    console.log('uniq urls length ==>', standAlonepointsList.length);
    //launch
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (let index = 0; index < standAlonepointsList.length; index++) {
    let url = '';
    if (standAlonepointsList[index] && standAlonepointsList[index].url) {
    url = standAlonepointsList[index].url;
    }
    if (standAlonepointsList[index]) {
    let link = standAlonepointsList[index].url ? standAlonepointsList[index].url.trim() : '';
    console.log('link===>', link);
    let urlResult = false;
    await validUrl.isUri(link, function (err, exists) {
      urlResult = exists;
    });
    await validUrl.isHttpUri(link, function (err, exists) {
      urlResult = exists;
    });
    await validUrl.isHttpsUri(link, function (err, exists) {
      urlResult = exists;
    });
    await validUrl.isWebUri(link, function (err, exists) {
      urlResult = exists;
    });
    if (!urlResult) {
      let validationResult = await validateURL(link);
      if (!validationResult) {
        link = "http://" + link;
        let httpValidationResult = await validUrl.isUri(link);
        if (!httpValidationResult) {
          link = "https://" + link;
          let httpsValidationResult = await validUrl.isUri(link);
          if (!httpsValidationResult) {
            await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
          } else {
            try {
              let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_' + index + 1;
              }
              await page.goto(link);
              let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
              console.log('actualfile', actualFile);
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject1', s3FileObject);
              if (matchingRecords.length > 0) {
                await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                })
                .catch((error) => { 
                  console.log('1', error.message); 
                })
              }
              await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                    $set: {
                      sourceName1: 'cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                    }
                  });
                }
              }
            } catch (e) {
              if (path.extname(link).includes('.pdf')) {
                await axios({
                  method: "get",
                  url: link,
                  responseType: "stream"
                }).then(async function (resp) {
                  let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject2', s3FileObject);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                    .catch((error) => { 
                      console.log('2', error.message); 
                    })
                  }
                  await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                })
                  .catch(async (error) => {
                    await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                  });
              } else {
                try {
                  await page.goto(link);
                  let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                  console.log('s3FileObject3', s3FileObject);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                    .catch((error) => { 
                      console.log('3', error.message); 
                    })
                  }
                  await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                } catch (err) {
                  await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                }
              }
            }
          }
        } else {
          try {
            await page.goto(link);
            let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
            console.log('matchingRecords length', matchingRecords.length);
            let fileName = '', publicationDate = '', fiscalYear = '';
            if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
                publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
            } else {
              fileName = 'cmp_source_' + index + 1;
            }
            let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
            let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
            console.log('s3FileObject4', s3FileObject);
            if (matchingRecords.length > 0) {
              await CompanySources.create({
                companyId: matchingRecords[0].companyId.id,
                sourceTypeId: null,
                sourceSubTypeId: null,
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index + 1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              })
              .catch((error) => { 
                console.log('4', error.message); 
              })
            }
            await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
            for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                  $set: {
                    sourceName1: 'cmp_source' + (recordsIndex + 1),
                    sourceFile: s3FileObject.Key
                  }
                });
              }
            }
          } catch (e) {
            if (path.extname(link).includes('.pdf')) {
              await axios({
                method: "get",
                url: link,
                responseType: "stream"
              }).then(async function (resp) {

                let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                console.log('s3FileObject5', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                  .catch((error) => { 
                    console.log('5', error.message); 
                  })
                }
                await BoardMembersMatrixDataPoints.updateMany({ url: url,isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              })
                .catch(async (error) => {
                  await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
                });
            } else {
              try {
                await page.goto(link);
                let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                console.log('s3FileObject6', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                  .catch((error) => { 
                    console.log('6', error.message); 
                  })
                }
                await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              } catch (err) {
                await BoardMembersMatrixDataPoints.updateMany({ url: url, isActive: true,status: true }, { $set: { isCounted: true } });
              }
            }
          }
        }
      } else {
        try {
          await page.goto(link);
          let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
          console.log('matchingRecords length', matchingRecords.length);
          let fileName = '', publicationDate = '', fiscalYear = '';
          if (matchingRecords.length > 0) {
            fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
            try {
              publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
            } catch (error) {
              publicationDate = new Date();
            }
            fiscalYear = matchingRecords[0].year;
          } else {
            fileName = 'cmp_source_' + index + 1;
          }
          let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
          let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
          console.log('s3FileObject7', s3FileObject);
          if (matchingRecords.length > 0) {
            await CompanySources.create({
              companyId: matchingRecords[0].companyId.id,
              sourceTypeId: null,
              sourceSubTypeId: null,
              isMultiYear: false,
              isMultiSource: false,
              sourceUrl: link,
              sourceFile: fileName,
              publicationDate: publicationDate,
              fiscalYear: fiscalYear,
              name: 'cmp_source' + index + 1,
              newSourceTypeName: '',
              newSubSourceTypeName: '',
              status: true
            })
            .catch((error) => { 
              console.log('7', error.message); 
            })
          }
          await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
          for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
            let recordObject = matchingRecords[recordsIndex];
            if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
              await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                $set: {
                  sourceName1: 'cmp_source' + (recordsIndex + 1),
                  sourceFile: s3FileObject.Key
                }
              });
            }
          }
        } catch (e) {
          if (path.extname(link).includes('.pdf')) {
            await axios({
              method: "get",
              url: link,
              responseType: "stream"
            }).then(async function (resp) {

              let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_' + index + 1;
              }
              console.log('resp.data', resp.data);
              // let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
              let actualFile = resp.data;
              console.log('actualFile', actualFile);
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject8', s3FileObject);
              console.log('matchingRecords.length', matchingRecords.length);
              if (matchingRecords.length > 0) {
                await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: s3FileObject.Key,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                })
                .catch((error) => { 
                  console.log('8', error.message); 
                });
              }
              await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                console.log('inside for loop8');
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  console.log('inside if block8');
                  await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                    $set: {
                      sourceName1: 'cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                    }
                  });
                }
              }
            })
              .catch(async (error) => {
                await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
              });
          } else {
            try {
              await page.goto(link);
              let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_' + index + 1;
              }
              let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
              console.log('s3FileObject9', s3FileObject);
              if (matchingRecords.length > 0) {
                await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                })
                .catch((error) => { 
                  console.log('9', error.message); 
                });
              }
              await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                    $set: {
                      sourceName1: 'cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                    }
                  });
                }
              }
            } catch (err) {
              await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
            }
          }
        }
      }
    } else {
      try {
        await page.goto(link);
        let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
        console.log('matchingRecords length', matchingRecords.length);
        let fileName = '', publicationDate = '', fiscalYear = '';
        if (matchingRecords.length > 0) {
          fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
          try {
            publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
          } catch (error) {
            publicationDate = new Date();
          }
          fiscalYear = matchingRecords[0].year;
        } else {
          fileName = 'cmp_source_' + index + 1;
        }
        let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
        let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
        console.log('s3FileObject10', s3FileObject);
        if (matchingRecords.length > 0) {
          await CompanySources.create({
            companyId: matchingRecords[0].companyId.id,
            sourceTypeId: null,
            sourceSubTypeId: null,
            isMultiYear: false,
            isMultiSource: false,
            sourceUrl: link,
            sourceFile: fileName,
            publicationDate: publicationDate,
            fiscalYear: fiscalYear,
            name: 'cmp_source' + index + 1,
            newSourceTypeName: '',
            newSubSourceTypeName: '',
            status: true
          })
          .catch((error) => { 
            console.log('10', error.message); 
          });            
        }
        await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
        for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
          let recordObject = matchingRecords[recordsIndex];
          if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
            await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
              $set: {
                sourceName1: 'cmp_source' + (recordsIndex + 1),
                sourceFile: s3FileObject.Key
              }
            });
          }
        }
      } catch (e) {
        if (path.extname(link).includes('.pdf')) {
          await axios({
            method: "get",
            url: link,
            responseType: "stream"
          }).then(async function (resp) {

            let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
            console.log('matchingRecords length', matchingRecords.length);
            let fileName = '', publicationDate = '', fiscalYear = '';
            if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
                publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
            } else {
              fileName = 'cmp_source_' + index + 1;
            }
            let actualFile = resp.data;
            let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
            console.log('s3FileObject11', s3FileObject);
            if (matchingRecords.length > 0) {
              await CompanySources.create({
                companyId: matchingRecords[0].companyId.id,
                sourceTypeId: null,
                sourceSubTypeId: null,
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index + 1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              })
              .catch((error) => {
                console.log('11', error.message);
              })
            }
            await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
            for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                  $set: {
                    sourceName1: 'cmp_source' + (recordsIndex + 1),
                    sourceFile: s3FileObject.Key
                  }
                });
              }
            }
          })
            .catch(async (error) => {
              await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
            });
        } else {
          try {
            await page.goto(link);

            let matchingRecords = await BoardMembersMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
            console.log('matchingRecords length', matchingRecords.length);
            let fileName = '', publicationDate = '', fiscalYear = '';
            if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
                publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
            } else {
              fileName = 'cmp_source_' + index + 1;
            }
            let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
            let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
            console.log('s3FileObject12', s3FileObject);
            if (matchingRecords.length > 0) {
              await CompanySources.create({
                companyId: matchingRecords[0].companyId.id,
                sourceTypeId: null,
                sourceSubTypeId: null,
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index + 1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              })
              .catch((error) => {
                console.log('12', error.message);
              })
            }
            await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
            for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                await BoardMembersMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                  $set: {
                    sourceName1: 'cmp_source' + (recordsIndex + 1),
                    sourceFile: s3FileObject.Key
                  }
                });
              }
            }
          } catch (err) {
            await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
          }
        }
      }
    }
    } else {
    await BoardMembersMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
    }
    }
    await browser.close();
    return res.status(200).json({ status: "200", message: "Completed successfully!" });
  } else if (params.id == 'KMP') {
    var standAlonepoints = await KmpMatrixDataPoints.find({ isCounted: false, isActive: true, status: true, url: { $exists: true, $nin: ["", " ", "`", "NA"] } }).limit(20000);
    let standAlonepointsList = _.uniqBy(standAlonepoints, 'url');
    console.log('uniq urls length ==>', standAlonepointsList.length);
    //launch
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (let index = 0; index < standAlonepointsList.length; index++) {
      let url = '';
      if (standAlonepointsList[index] && standAlonepointsList[index].url) {
        url = standAlonepointsList[index].url;
      }
      if (standAlonepointsList[index]) {
        let link = standAlonepointsList[index].url ? standAlonepointsList[index].url.trim() : '';
        console.log('link===>', link);
        let urlResult = false;
        await validUrl.isUri(link, function (err, exists) {
          urlResult = exists;
        });
        await validUrl.isHttpUri(link, function (err, exists) {
          urlResult = exists;
        });
        await validUrl.isHttpsUri(link, function (err, exists) {
          urlResult = exists;
        });
        await validUrl.isWebUri(link, function (err, exists) {
          urlResult = exists;
        });
        if (!urlResult) {
          let validationResult = await validateURL(link);
          if (!validationResult) {
            link = "http://" + link;
            let httpValidationResult = await validUrl.isUri(link);
            if (!httpValidationResult) {
              link = "https://" + link;
              let httpsValidationResult = await validUrl.isUri(link);
              if (!httpsValidationResult) {
                await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isCounted: true } });
              } else {
                try {
                  let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  await page.goto(link);
                  let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
                  console.log('actualfile', actualFile);
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject1', s3FileObject);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                      .catch((error) => {
                        console.log('1', error.message);
                      })
                  }
                  await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                } catch (e) {
                  if (path.extname(link).includes('.pdf')) {
                    await axios({
                      method: "get",
                      url: link,
                      responseType: "stream"
                    }).then(async function (resp) {
                      let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
                      console.log('matchingRecords length', matchingRecords.length);
                      let fileName = '', publicationDate = '', fiscalYear = '';
                      if (matchingRecords.length > 0) {
                        fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                        try {
                          publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                        } catch (error) {
                          publicationDate = new Date();
                        }
                        fiscalYear = matchingRecords[0].year;
                      } else {
                        fileName = 'cmp_source_' + index + 1;
                      }
                      let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                      let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                      console.log('s3FileObject2', s3FileObject);
                      if (matchingRecords.length > 0) {
                        await CompanySources.create({
                          companyId: matchingRecords[0].companyId.id,
                          sourceTypeId: null,
                          sourceSubTypeId: null,
                          isMultiYear: false,
                          isMultiSource: false,
                          sourceUrl: link,
                          sourceFile: fileName,
                          publicationDate: publicationDate,
                          fiscalYear: fiscalYear,
                          name: 'cmp_source' + index + 1,
                          newSourceTypeName: '',
                          newSubSourceTypeName: '',
                          status: true
                        })
                          .catch((error) => {
                            console.log('2', error.message);
                          })
                      }
                      await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                      for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                        let recordObject = matchingRecords[recordsIndex];
                        if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                          await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                            $set: {
                              sourceName1: 'cmp_source' + (recordsIndex + 1),
                              sourceFile: s3FileObject.Key
                            }
                          });
                        }
                      }
                    })
                      .catch(async (error) => {
                        await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isCounted: true } });
                      });
                  } else {
                    try {
                      await page.goto(link);
                      let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
                      console.log('matchingRecords length', matchingRecords.length);
                      let fileName = '', publicationDate = '', fiscalYear = '';
                      if (matchingRecords.length > 0) {
                        fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                        try {
                          publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                        } catch (error) {
                          publicationDate = new Date();
                        }
                        fiscalYear = matchingRecords[0].year;
                      } else {
                        fileName = 'cmp_source_' + index + 1;
                      }
                      let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                      let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                      console.log('s3FileObject3', s3FileObject);
                      if (matchingRecords.length > 0) {
                        await CompanySources.create({
                          companyId: matchingRecords[0].companyId.id,
                          sourceTypeId: null,
                          sourceSubTypeId: null,
                          isMultiYear: false,
                          isMultiSource: false,
                          sourceUrl: link,
                          sourceFile: fileName,
                          publicationDate: publicationDate,
                          fiscalYear: fiscalYear,
                          name: 'cmp_source' + index + 1,
                          newSourceTypeName: '',
                          newSubSourceTypeName: '',
                          status: true
                        })
                          .catch((error) => {
                            console.log('3', error.message);
                          })
                      }
                      await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                      for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                        let recordObject = matchingRecords[recordsIndex];
                        if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                          await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                            $set: {
                              sourceName1: 'cmp_source' + (recordsIndex + 1),
                              sourceFile: s3FileObject.Key
                            }
                          });
                        }
                      }
                    } catch (err) {
                      await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isCounted: true } });
                    }
                  }
                }
              }
            } else {
              try {
                await page.goto(link);
                let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                console.log('s3FileObject4', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                    .catch((error) => {
                      console.log('4', error.message);
                    })
                }
                await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              } catch (e) {
                if (path.extname(link).includes('.pdf')) {
                  await axios({
                    method: "get",
                    url: link,
                    responseType: "stream"
                  }).then(async function (resp) {

                    let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
                    console.log('matchingRecords length', matchingRecords.length);
                    let fileName = '', publicationDate = '', fiscalYear = '';
                    if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                        publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                        publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                    } else {
                      fileName = 'cmp_source_' + index + 1;
                    }
                    let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                    let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                    console.log('s3FileObject5', s3FileObject);
                    if (matchingRecords.length > 0) {
                      await CompanySources.create({
                        companyId: matchingRecords[0].companyId.id,
                        sourceTypeId: null,
                        sourceSubTypeId: null,
                        isMultiYear: false,
                        isMultiSource: false,
                        sourceUrl: link,
                        sourceFile: fileName,
                        publicationDate: publicationDate,
                        fiscalYear: fiscalYear,
                        name: 'cmp_source' + index + 1,
                        newSourceTypeName: '',
                        newSubSourceTypeName: '',
                        status: true
                      })
                        .catch((error) => {
                          console.log('5', error.message);
                        })
                    }
                    await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                    for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                        await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                          $set: {
                            sourceName1: 'cmp_source' + (recordsIndex + 1),
                            sourceFile: s3FileObject.Key
                          }
                        });
                      }
                    }
                  })
                    .catch(async (error) => {
                      await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isCounted: true } });
                    });
                } else {
                  try {
                    await page.goto(link);
                    let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
                    console.log('matchingRecords length', matchingRecords.length);
                    let fileName = '', publicationDate = '', fiscalYear = '';
                    if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                        publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                        publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                    } else {
                      fileName = 'cmp_source_' + index + 1;
                    }
                    let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                    let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                    console.log('s3FileObject6', s3FileObject);
                    if (matchingRecords.length > 0) {
                      await CompanySources.create({
                        companyId: matchingRecords[0].companyId.id,
                        sourceTypeId: null,
                        sourceSubTypeId: null,
                        isMultiYear: false,
                        isMultiSource: false,
                        sourceUrl: link,
                        sourceFile: fileName,
                        publicationDate: publicationDate,
                        fiscalYear: fiscalYear,
                        name: 'cmp_source' + index + 1,
                        newSourceTypeName: '',
                        newSubSourceTypeName: '',
                        status: true
                      })
                        .catch((error) => {
                          console.log('6', error.message);
                        })
                    }
                    await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                    for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                        await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                          $set: {
                            sourceName1: 'cmp_source' + (recordsIndex + 1),
                            sourceFile: s3FileObject.Key
                          }
                        });
                      }
                    }
                  } catch (err) {
                    await KmpMatrixDataPoints.updateMany({ url: url, isActive: true, status: true }, { $set: { isCounted: true } });
                  }
                }
              }
            }
          } else {
            try {
              await page.goto(link);
              let matchingRecords = await KmpMatrixDataPoints.find({ url: url, isActive: true, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_' + index + 1;
              }
              let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject7', s3FileObject);
              if (matchingRecords.length > 0) {
                await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                })
                  .catch((error) => {
                    console.log('7', error.message);
                  })
              }
              await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                    $set: {
                      sourceName1: 'cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                    }
                  });
                }
              }
            } catch (e) {
              if (path.extname(link).includes('.pdf')) {
                await axios({
                  method: "get",
                  url: link,
                  responseType: "stream"
                }).then(async function (resp) {

                  let matchingRecords = await KmpMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  console.log('resp.data', resp.data);
                  // let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                  let actualFile = resp.data;
                  console.log('actualFile', actualFile);
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject8', s3FileObject);
                  console.log('matchingRecords.length', matchingRecords.length);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: s3FileObject.Key,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                      .catch((error) => {
                        console.log('8', error.message);
                      });
                  }
                  await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    console.log('inside for loop8');
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      console.log('inside if block8');
                      await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                })
                  .catch(async (error) => {
                    await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
                  });
              } else {
                try {
                  await page.goto(link);
                  let matchingRecords = await KmpMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_' + index + 1;
                  }
                  let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                  console.log('s3FileObject9', s3FileObject);
                  if (matchingRecords.length > 0) {
                    await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    })
                      .catch((error) => {
                        console.log('9', error.message);
                      });
                  }
                  await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                        $set: {
                          sourceName1: 'cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                        }
                      });
                    }
                  }
                } catch (err) {
                  await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
                }
              }
            }
          }
        } else {
          try {
            await page.goto(link);
            let matchingRecords = await KmpMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
            console.log('matchingRecords length', matchingRecords.length);
            let fileName = '', publicationDate = '', fiscalYear = '';
            if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
                publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
            } else {
              fileName = 'cmp_source_' + index + 1;
            }
            let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
            let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
            console.log('s3FileObject10', s3FileObject);
            if (matchingRecords.length > 0) {
              await CompanySources.create({
                companyId: matchingRecords[0].companyId.id,
                sourceTypeId: null,
                sourceSubTypeId: null,
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index + 1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              })
                .catch((error) => {
                  console.log('10', error.message);
                });
            }
            await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
            for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                  $set: {
                    sourceName1: 'cmp_source' + (recordsIndex + 1),
                    sourceFile: s3FileObject.Key
                  }
                });
              }
            }
          } catch (e) {
            if (path.extname(link).includes('.pdf')) {
              await axios({
                method: "get",
                url: link,
                responseType: "stream"
              }).then(async function (resp) {

                let matchingRecords = await KmpMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = resp.data;
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                console.log('s3FileObject11', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                    .catch((error) => {
                      console.log('11', error.message);
                    })
                }
                await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              })
                .catch(async (error) => {
                  await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
                });
            } else {
              try {
                await page.goto(link);

                let matchingRecords = await KmpMatrixDataPoints.find({ url: url, status: true }).populate('companyId').populate('datapointId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_' + index + 1;
                }
                let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                console.log('s3FileObject12', s3FileObject);
                if (matchingRecords.length > 0) {
                  await CompanySources.create({
                    companyId: matchingRecords[0].companyId.id,
                    sourceTypeId: null,
                    sourceSubTypeId: null,
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index + 1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  })
                    .catch((error) => {
                      console.log('12', error.message);
                    })
                }
                await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await KmpMatrixDataPoints.updateOne({ _id: recordObject.id }, {
                      $set: {
                        sourceName1: 'cmp_source' + (recordsIndex + 1),
                        sourceFile: s3FileObject.Key
                      }
                    });
                  }
                }
              } catch (err) {
                await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
              }
            }
          }
        }
      } else {
        await KmpMatrixDataPoints.updateMany({ url: url, status: true }, { $set: { isCounted: true } });
      }
    }
    await browser.close();
    return res.status(200).json({ status: "200", message: "Completed successfully!" });
  }
}

export const updateControversySourceUrls = async ({ params }, res, next) => {

  var standAlonepoints = await Controversy.find({ isCounted: false, isActive : true, status: true, sourceURL: { $nin: ["", " "] } }).limit(10000);
  let standAlonepointsList = _.uniqBy(standAlonepoints, 'sourceURL');
  console.log('uniq urls length ==>', standAlonepointsList.length);
  //launch
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (let index = 0; index < standAlonepointsList.length; index++) {
      let url = '';
      if (standAlonepointsList[index] && standAlonepointsList[index].sourceURL) {
      url = standAlonepointsList[index].sourceURL;
      }
      if (standAlonepointsList[index]) {
      let link = standAlonepointsList[index].sourceURL ? standAlonepointsList[index].sourceURL.trim() : '';
      console.log('link===>', link);
      let urlResult = false;
      await validUrl.isUri(link, function (err, exists) {
          urlResult = exists;
      });
      await validUrl.isHttpUri(link, function (err, exists) {
          urlResult = exists;
      });
      await validUrl.isHttpsUri(link, function (err, exists) {
          urlResult = exists;
      });
      await validUrl.isWebUri(link, function (err, exists) {
          urlResult = exists;
      });
      if (!urlResult) {
          let validationResult = await validateURL(link);
          if (!validationResult) {
          link = "http://" + link;
          let httpValidationResult = await validUrl.isUri(link);
          if (!httpValidationResult) {
              link = "https://" + link;
              let httpsValidationResult = await validUrl.isUri(link);
              if (!httpsValidationResult) {
              await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isCounted: true } });
              } else {
              try {
                  let matchingRecords = await Controversy.find({ sourceURL: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                      publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                  } else {
                  fileName = 'controversy_cmp_source_' + index + 1;
                  }
                  await page.goto(link);
                  let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
                  console.log('actualfile', actualFile);
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject1', s3FileObject);
                  if (matchingRecords.length > 0) {
                  await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'controversy_cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                  })
                  .catch((error) => { 
                      console.log('1', error.message); 
                  })
                  }
                  await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await Controversy.updateOne({ _id: recordObject.id }, {
                      $set: {
                          sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                      }
                      });
                  }
                  }
              } catch (e) {
                  if (path.extname(link).includes('.pdf')) {
                  await axios({
                      method: "get",
                      url: link,
                      responseType: "stream"
                  }).then(async function (resp) {
                      let matchingRecords = await Controversy.find({ sourceURL: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                      console.log('matchingRecords length', matchingRecords.length);
                      let fileName = '', publicationDate = '', fiscalYear = '';
                      if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                          publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                          publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                      } else {
                      fileName = 'controversy_cmp_source_' + index + 1;
                      }
                      let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                      let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                      console.log('s3FileObject2', s3FileObject);
                      if (matchingRecords.length > 0) {
                      await CompanySources.create({
                          companyId: matchingRecords[0].companyId.id,
                          sourceTypeId: null,
                          sourceSubTypeId: null,
                          isMultiYear: false,
                          isMultiSource: false,
                          sourceUrl: link,
                          sourceFile: fileName,
                          publicationDate: publicationDate,
                          fiscalYear: fiscalYear,
                          name: 'controversy_cmp_source' + index + 1,
                          newSourceTypeName: '',
                          newSubSourceTypeName: '',
                          status: true
                      })
                      .catch((error) => { 
                          console.log('2', error.message); 
                      })
                      }
                      await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                      for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                          await Controversy.updateOne({ _id: recordObject.id }, {
                          $set: {
                              sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                              sourceFile: s3FileObject.Key
                          }
                          });
                      }
                      }
                  })
                      .catch(async (error) => {
                      await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isCounted: true } });
                      });
                  } else {
                  try {
                      await page.goto(link);
                      let matchingRecords = await Controversy.find({ sourceURL: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                      console.log('matchingRecords length', matchingRecords.length);
                      let fileName = '', publicationDate = '', fiscalYear = '';
                      if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                          publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                          publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                      } else {
                      fileName = 'controversy_cmp_source_' + index + 1;
                      }
                      let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                      let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                      console.log('s3FileObject3', s3FileObject);
                      if (matchingRecords.length > 0) {
                      await CompanySources.create({
                          companyId: matchingRecords[0].companyId.id,
                          sourceTypeId: null,
                          sourceSubTypeId: null,
                          isMultiYear: false,
                          isMultiSource: false,
                          sourceUrl: link,
                          sourceFile: fileName,
                          publicationDate: publicationDate,
                          fiscalYear: fiscalYear,
                          name: 'controversy_cmp_source' + index + 1,
                          newSourceTypeName: '',
                          newSubSourceTypeName: '',
                          status: true
                      })
                      .catch((error) => { 
                          console.log('3', error.message); 
                      })
                      }
                      await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                      for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                          await Controversy.updateOne({ _id: recordObject.id }, {
                          $set: {
                              sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                              sourceFile: s3FileObject.Key
                          }
                          });
                      }
                      }
                  } catch (err) {
                      await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isCounted: true } });
                  }
                  }
              }
              }
          } else {
              try {
              await page.goto(link);
              let matchingRecords = await Controversy.find({ sourceURL: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                  publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
              } else {
                  fileName = 'controversy_cmp_source_' + index + 1;
              }
              let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject4', s3FileObject);
              if (matchingRecords.length > 0) {
                  await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'controversy_cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                  })
                  .catch((error) => { 
                  console.log('4', error.message); 
                  })
              }
              await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await Controversy.updateOne({ _id: recordObject.id }, {
                      $set: {
                      sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                      }
                  });
                  }
              }
              } catch (e) {
              if (path.extname(link).includes('.pdf')) {
                  await axios({
                  method: "get",
                  url: link,
                  responseType: "stream"
                  }).then(async function (resp) {

                  let matchingRecords = await Controversy.find({ sourceURL: url, isActive: true,status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                      publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                  } else {
                      fileName = 'controversy_cmp_source_' + index + 1;
                  }
                  let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject5', s3FileObject);
                  if (matchingRecords.length > 0) {
                      await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'controversy_cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                      })
                      .catch((error) => { 
                      console.log('5', error.message); 
                      })
                  }
                  await Controversy.updateMany({ sourceURL: url,isActive: true, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await Controversy.updateOne({ _id: recordObject.id }, {
                          $set: {
                          sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                          }
                      });
                      }
                  }
                  })
                  .catch(async (error) => {
                      await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isCounted: true } });
                  });
              } else {
                  try {
                  await page.goto(link);
                  let matchingRecords = await Controversy.find({ sourceURL: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                      try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                      publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                  } else {
                      fileName = 'controversy_cmp_source_' + index + 1;
                  }
                  let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                  console.log('s3FileObject6', s3FileObject);
                  if (matchingRecords.length > 0) {
                      await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'controversy_cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                      })
                      .catch((error) => { 
                      console.log('6', error.message); 
                      })
                  }
                  await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await Controversy.updateOne({ _id: recordObject.id }, {
                          $set: {
                          sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                          }
                      });
                      }
                  }
                  } catch (err) {
                  await Controversy.updateMany({ sourceURL: url, isActive: true,status: true }, { $set: { isCounted: true } });
                  }
              }
              }
          }
          } else {
          try {
              await page.goto(link);
              let matchingRecords = await Controversy.find({ sourceURL: url,isActive: true, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                  publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
              } else {
              fileName = 'controversy_cmp_source_' + index + 1;
              }
              let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject7', s3FileObject);
              if (matchingRecords.length > 0) {
              await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'controversy_cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
              })
              .catch((error) => { 
                  console.log('7', error.message); 
              })
              }
              await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await Controversy.updateOne({ _id: recordObject.id }, {
                  $set: {
                      sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                  }
                  });
              }
              }
          } catch (e) {
              if (path.extname(link).includes('.pdf')) {
              await axios({
                  method: "get",
                  url: link,
                  responseType: "stream"
              }).then(async function (resp) {

                  let matchingRecords = await Controversy.find({ sourceURL: url, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                      publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                  } else {
                  fileName = 'controversy_cmp_source_' + index + 1;
                  }
                  console.log('resp.data', resp.data);
                  // let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                  let actualFile = resp.data;
                  console.log('actualFile', actualFile);
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
                  console.log('s3FileObject8', s3FileObject);
                  console.log('matchingRecords.length', matchingRecords.length);
                  if (matchingRecords.length > 0) {
                  await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: s3FileObject.Key,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'controversy_cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                  })
                  .catch((error) => { 
                      console.log('8', error.message); 
                  });
                  }
                  await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  console.log('inside for loop8');
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      console.log('inside if block8');
                      await Controversy.updateOne({ _id: recordObject.id }, {
                      $set: {
                          sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                      }
                      });
                  }
                  }
              })
                  .catch(async (error) => {
                  await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isCounted: true } });
                  });
              } else {
              try {
                  await page.goto(link);
                  let matchingRecords = await Controversy.find({ sourceURL: url, status: true }).populate('companyId').populate('datapointId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                      publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                  } else {
                  fileName = 'controversy_cmp_source_' + index + 1;
                  }
                  let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                  let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
                  console.log('s3FileObject9', s3FileObject);
                  if (matchingRecords.length > 0) {
                  await CompanySources.create({
                      companyId: matchingRecords[0].companyId.id,
                      sourceTypeId: null,
                      sourceSubTypeId: null,
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'controversy_cmp_source' + index + 1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                  })
                  .catch((error) => { 
                      console.log('9', error.message); 
                  });
                  }
                  await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await Controversy.updateOne({ _id: recordObject.id }, {
                      $set: {
                          sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                          sourceFile: s3FileObject.Key
                      }
                      });
                  }
                  }
              } catch (err) {
                  await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isCounted: true } });
              }
              }
          }
          }
      } else {
          try {
          await page.goto(link);
          let matchingRecords = await Controversy.find({ sourceURL: url, status: true }).populate('companyId').populate('datapointId');
          console.log('matchingRecords length', matchingRecords.length);
          let fileName = '', publicationDate = '', fiscalYear = '';
          if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
              try {
              publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
              publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
          } else {
              fileName = 'controversy_cmp_source_' + index + 1;
          }
          let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
          let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
          console.log('s3FileObject10', s3FileObject);
          if (matchingRecords.length > 0) {
              await CompanySources.create({
              companyId: matchingRecords[0].companyId.id,
              sourceTypeId: null,
              sourceSubTypeId: null,
              isMultiYear: false,
              isMultiSource: false,
              sourceUrl: link,
              sourceFile: fileName,
              publicationDate: publicationDate,
              fiscalYear: fiscalYear,
              name: 'controversy_cmp_source' + index + 1,
              newSourceTypeName: '',
              newSubSourceTypeName: '',
              status: true
              })
              .catch((error) => { 
              console.log('10', error.message); 
              });            
          }
          await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
          for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
              await Controversy.updateOne({ _id: recordObject.id }, {
                  $set: {
                  sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                  sourceFile: s3FileObject.Key
                  }
              });
              }
          }
          } catch (e) {
          if (path.extname(link).includes('.pdf')) {
              await axios({
              method: "get",
              url: link,
              responseType: "stream"
              }).then(async function (resp) {

              let matchingRecords = await Controversy.find({ sourceURL: url, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                  publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
              } else {
                  fileName = 'controversy_cmp_source_' + index + 1;
              }
              let actualFile = resp.data;
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.pdf', 'application/pdf');
              console.log('s3FileObject11', s3FileObject);
              if (matchingRecords.length > 0) {
                  await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'controversy_cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                  })
                  .catch((error) => {
                  console.log('11', error.message);
                  })
              }
              await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await Controversy.updateOne({ _id: recordObject.id }, {
                      $set: {
                      sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                      }
                  });
                  }
              }
              })
              .catch(async (error) => {
                  await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isCounted: true } });
              });
          } else {
              try {
              await page.goto(link);

              let matchingRecords = await Controversy.find({ sourceURL: url, status: true }).populate('companyId').populate('datapointId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + matchingRecords[0].datapointId.code + '_' + 'cmp_source_' + (index + 1);
                  try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                  publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
              } else {
                  fileName = 'controversy_cmp_source_' + index + 1;
              }
              let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
              let s3FileObject = await storeFileInS3(actualFile, fileName + '.png', 'image/png');
              console.log('s3FileObject12', s3FileObject);
              if (matchingRecords.length > 0) {
                  await CompanySources.create({
                  companyId: matchingRecords[0].companyId.id,
                  sourceTypeId: null,
                  sourceSubTypeId: null,
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'controversy_cmp_source' + index + 1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                  })
                  .catch((error) => {
                  console.log('12', error.message);
                  })
              }
              await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isDownloaded: true, isCounted: true } });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await Controversy.updateOne({ _id: recordObject.id }, {
                      $set: {
                      sourceName1: 'controversy_cmp_source' + (recordsIndex + 1),
                      sourceFile: s3FileObject.Key
                      }
                  });
                  }
              }
              } catch (err) {
              await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isCounted: true } });
              }
          }
          }
      }
      } else {
      await Controversy.updateMany({ sourceURL: url, status: true }, { $set: { isCounted: true } });
      }
  }
  await browser.close();
  return res.status(200).json({ status: "200", message: "Completed successfully!" });
}

export const updateScreenshots = async ({ params }, res, next) => {
  console.log('in screenshot update');
  fs.readdir("./src/api/functions/Batch_1", async (err, files) => {
    if (err) throw err;
    var allCompanyDetails = await Companies.find({ clientTaxonomyId: "60c76f299def09f5ef0dca5c", status: true });
    var alldpCodeDetails = await Datapoints.find({ clientTaxonomyId: "60c76f299def09f5ef0dca5c", status: true });
    for (let index = 0; index < files.length; index++) {
      console.log('count', index);
      var fileArray = files[index].split('_');
      var company = allCompanyDetails.find(function (rec) {
          return rec.cmieProwessCode === fileArray[0]
      });
      // console.log('company', company);
      if (company && Object.keys(company).length > 0) {
        var currentYear = fileArray[1];
        var lastYear = moment(currentYear).subtract(1, "year").format('YYYY');
        var financialYear = lastYear + '-' + currentYear;
        var dpcode = fileArray[2].split('.')[0];
        var dpCodeDetails = alldpCodeDetails.find(function (rec1) {
          return rec1.code === dpcode
        });
        if (dpCodeDetails && Object.keys(dpCodeDetails).length > 0) {
          await StandaloneDatapoints.updateMany({ companyId: company.id, year: financialYear, datapointId: dpCodeDetails.id, status: true, isActive: true }, { $set: { "screenShot1": files[index] } });
          await BoardMembersMatrixDataPoints.updateMany({ companyId: company.id, year: financialYear, datapointId: dpCodeDetails.id, status: true, isActive: true }, { $set: { "screenShot1": files[index] } });
          await KmpMatrixDataPoints.updateMany({ companyId: company.id, year: financialYear, datapointId: dpCodeDetails.id, status: true, isActive: true }, { $set: { "screenShot1": files[index] } });
          await Controversy.updateMany({ companyId: company.id, year: financialYear, datapointId: dpCodeDetails.id, status: true, isActive: true }, { $set: { "screenShot1": files[index] } });
        }
      }
    }
    res.send({
      "message": "screenshots migrated"
    })
  });
}

export const crossCheckCompanySources = async ({ params }, res, next) => {
  let allCompanySourceURLs = await CompanySources.find({ status: true, fiscalYear: "2019-2020" }).distinct("sourceUrl");
  console.log('allCompanySourceURLs.length', allCompanySourceURLs.length);
  let notRecordedSourceURLs = await BoardMembersMatrixDataPoints.find({ url: { $in: allCompanySourceURLs }, sourceFile: { $exists: true }, isCounted: true, isDownloaded: true, status: true });
  console.log('notRecordedSourceURLs.length', notRecordedSourceURLs.length);
  for (let crossCheckIndex = 0; crossCheckIndex < notRecordedSourceURLs.length; crossCheckIndex++) {
    let object = notRecordedSourceURLs[crossCheckIndex];
    console.log('object', object);
    let publicationDate;
    try {
      publicationDate = getJsDateFromExcel(object.publicationDate);
    } catch (error) {
      publicationDate = new Date();
    }
    let companySourceObject = {
      companyId: object.companyId,
      sourceTypeId: null,
      sourceSubTypeId: null,
      isMultiYear: false,
      isMultiSource: false,
      sourceUrl: object.url,
      sourceFile: object.sourceFile,
      publicationDate: publicationDate,
      fiscalYear: object.year,
      name: object.sourceName ? object.sourceName : object.sourceName1,
      newSourceTypeName: '',
      newSubSourceTypeName: '',
      status: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    console.log('companySourceObject', companySourceObject);
    await CompanySources.updateOne({ companyId: object.companyId, sourceFile: object.sourceFile, sourceUrl: object.url, fiscalYear: object.year, status: true }, { 
      $set: companySourceObject 
    }, { upsert: true });
  }
  return res.status(200).json({ message: "Not recorded source files", data: notRecordedSourceURLs });
}

export const updateSourceZipFiles = async ({ params }, res, next) => {
  console.log('updateSourceZipFiles called!');
  let fileList = [];
  await fs.readFile(__dirname + '/zipFilesForSource.json', async (err, data) => {
      if (err) throw err;
      fileList = JSON.parse(data);
      console.log('here fileList', fileList.length);
  })
  await fs.readdir("./src/api/functions/zipfiles", async (err, files) => {
      if (err) throw err;
      for (let index = 0; index < files.length; index++) {
      console.log('file name', files[index]);
      let fileName = files[index];
      let fileNameWithoutExtension = files[index].split('.zip')[0];
      console.log('fileNameWithoutExtension', fileNameWithoutExtension);
      console.log('fileList.length', fileList.length);
      let urlToUpdate = fileList.find((obj) => obj.sourceName1 == fileNameWithoutExtension);
      console.log('urlToUpdate.sourceName1', urlToUpdate.sourceName1);
      console.log('fileName', fileName);
      await StandaloneDatapoints.updateMany({ url: urlToUpdate.url, status: true }, { 
          $set: { "sourceFile": fileName, "sourceName1": urlToUpdate.sourceName1, isCounted: true, isDownloaded: true } });
      await BoardMembersMatrixDataPoints.updateMany({ url: urlToUpdate.url, status: true }, { 
          $set: { "sourceFile": fileName, "sourceName1": urlToUpdate.sourceName1 } });
      await KmpMatrixDataPoints.updateMany({ url: urlToUpdate.url, status: true }, { 
          $set: { "sourceFile": fileName, "sourceName1": urlToUpdate.sourceName1 } });
      }
      res.send({
      "message": "zip files migrated"
      })
  });
}

export const correctCompanySourceNames = async ({ params }, res, next) => {
  let allCompanySourceList = await CompanySources.find({status: true});
  if (allCompanySourceList.length > 0) {
    for (let cmpSrcIndex = 0; cmpSrcIndex < allCompanySourceList.length; cmpSrcIndex++) {
      let obj = allCompanySourceList[cmpSrcIndex];
      let standaloneDetail = await StandaloneDatapoints.findOne({ url: obj.sourceUrl, sourceName1: obj.name, sourceFile: obj.sourceFile, status: true, isActive: true });
      if (standaloneDetail) {
        await CompanySources.updateOne({ _id: obj.id }, { 
          $set: { 
            name: standaloneDetail.sourceName ? standaloneDetail.sourceName : obj.name 
          } 
        });
      }
      let boardMemberDetail = await BoardMembersMatrixDataPoints.findOne({ url: obj.sourceUrl, sourceName1: obj.name, sourceFile: obj.sourceFile, status: true, isActive: true });
      if (!standaloneDetail && boardMemberDetail) {
        await CompanySources.updateOne({ _id: obj.id }, { 
          $set: { 
            name: boardMemberDetail.sourceName ? boardMemberDetail.sourceName : obj.name 
          } 
        });
      }
      let kmpMemberDetail = await KmpMatrixDataPoints.findOne({ url: obj.sourceUrl, sourceName1: obj.name, sourceFile: obj.sourceFile, status: true, isActive: true });
      if (!standaloneDetail && !boardMemberDetail && kmpMemberDetail) {
        await CompanySources.updateOne({ _id: obj.id }, { 
          $set: { 
            name: kmpMemberDetail.sourceName ? kmpMemberDetail.sourceName : obj.name 
          } 
        });
      }
      let controversyDetail = await Controversy.findOne({ sourceURL: obj.sourceUrl, sourceName1: obj.name, sourceFile: obj.sourceFile, status: true, isActive: true });
      if (!standaloneDetail && !boardMemberDetail && !kmpMemberDetail && controversyDetail) {
        await CompanySources.updateOne({ _id: obj.id }, { 
          $set: { 
            name: controversyDetail.sourceName ? controversyDetail.sourceName : obj.name 
          } 
        });
      }
    }
  }
}

async function validateURL(link) {
  if (link.indexOf("http://") == 0 || link.indexOf("https://") == 0) {
    console.log("The link has http or https.");
    return true;
  } else {
    console.log("The link doesn't have http or https.");
    return false;
  }
}

async function storeFileInS3(actualFile, fileName, contentType) {
  console.log('actualFile', actualFile, 'fileName', fileName, 'contentType', contentType);
  return new Promise(function (resolve, reject) {
    const params = {
      Bucket: 'esgds-company-sources-prod',
      Key: fileName,
      Body: actualFile,
      ContentType: contentType
    };
    console.log('params', params.Key);
    s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err)
      } else {
        resolve(data);
      }
    });
  })
}