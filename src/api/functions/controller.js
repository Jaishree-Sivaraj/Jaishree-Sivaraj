import validUrl from 'valid-url'
import _ from 'lodash';
import puppeteer from "puppeteer";
import axios from 'axios';
import fs from "fs"
import path from 'path';
import * as AWS from 'aws-sdk'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { success, notFound } from '../../services/response/'
import { Functions } from '.'
import { StandaloneDatapoints } from "../standalone_datapoints"
import { CompanySources } from "../companySources"

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

  var standAlonepoints = await StandaloneDatapoints.find({ status: true, isCounted: false }).limit(100);
  let standAlonepointsList = _.uniqBy(standAlonepoints, 'url');
  console.log('uniq urls length ==>', standAlonepointsList.length);
  //launch
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (let index = 0; index < 5; index++) {
    let url = '';
    if(standAlonepointsList[index] && standAlonepointsList[index].url){
      url = standAlonepointsList[index].url;
    }
    if (standAlonepointsList[index]) {
      let link = standAlonepointsList[index].url ? standAlonepointsList[index].url.trim() : '';
      console.log('link===>', link);
      let urlResult = false;
      await validUrl.isUri(link, function(err, exists) {
        urlResult = exists;
      });
      await validUrl.isHttpUri(link, function(err, exists) {
        urlResult = exists;
      });
      await validUrl.isHttpsUri(link, function(err, exists) {
        urlResult = exists;
      });
      await validUrl.isWebUri(link, function(err, exists) {
        urlResult = exists;
      });
      if (!urlResult) {
        let validationResult = await validateURL(link);
        if (!validationResult) {
          link = "http://"+link;
          let httpValidationResult = await validUrl.isUri(link);
          if (!httpValidationResult) {
            link = "https://"+link;
            let httpsValidationResult = await validUrl.isUri(link);
            if (!httpsValidationResult) {
              await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
            } else {
              try {
                let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_'+ index+1;
                }
                await page.goto(link);
                let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
                let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
                console.log('s3FileObject', s3FileObject);
                await CompanySources.create({
                  companyId: '',
                  sourceTypeId: '',
                  sourceSubTypeId: '',
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index+1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                      $set: { 
                        sourceName: 'cmp_source' + (recordsIndex+1),
                        url: fileName
                      }
                    });
                  }
                }
                await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
              } catch (e) {
                if (path.extname(link).includes('.pdf')) {
                  await axios({
                    method: "get",
                    url: link,
                    responseType: "stream"
                  }).then(async function (resp) {
                    let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                    console.log('matchingRecords length', matchingRecords.length);
                    let fileName = '', publicationDate = '', fiscalYear = '';
                    if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                      try {
                        publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                        publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                    } else {
                      fileName = 'cmp_source_'+ index+1;
                    }
                    let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                    let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
                    console.log('s3FileObject', s3FileObject);
                    await CompanySources.create({
                      companyId: '',
                      sourceTypeId: '',
                      sourceSubTypeId: '',
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index+1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    });
                    for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                        await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                          $set: { 
                            sourceName: 'cmp_source' + (recordsIndex+1),
                            url: fileName
                          }
                        });
                      }
                    }
                    await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
                  })
                  .catch(async (error) => {
                    await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
                  });
                } else {
                  try {
                    await page.goto(link);
                    let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                    console.log('matchingRecords length', matchingRecords.length);
                    let fileName = '', publicationDate = '', fiscalYear = '';
                    if (matchingRecords.length > 0) {
                      fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                      try {
                        publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                      } catch (error) {
                        publicationDate = new Date();
                      }
                      fiscalYear = matchingRecords[0].year;
                    } else {
                      fileName = 'cmp_source_'+ index+1;
                    }                    
                    let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                    let s3FileObject = await storeFileInS3(actualFile, fileName+'.png', 'image/png');
                    console.log('s3FileObject', s3FileObject);
                    await CompanySources.create({
                      companyId: '',
                      sourceTypeId: '',
                      sourceSubTypeId: '',
                      isMultiYear: false,
                      isMultiSource: false,
                      sourceUrl: link,
                      sourceFile: fileName,
                      publicationDate: publicationDate,
                      fiscalYear: fiscalYear,
                      name: 'cmp_source' + index+1,
                      newSourceTypeName: '',
                      newSubSourceTypeName: '',
                      status: true
                    });
                    for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                      let recordObject = matchingRecords[recordsIndex];
                      if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                        await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                          $set: { 
                            sourceName: 'cmp_source' + (recordsIndex+1),
                            url: fileName
                          }
                        });
                      }
                    }
                    await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
                  } catch (err) {
                    await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
                  }
                }
              }
            }
          } else {
            try {
              await page.goto(link);
              let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_'+ index+1;
              }                    
              let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
              let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
              console.log('s3FileObject', s3FileObject);
              await CompanySources.create({
                companyId: '',
                sourceTypeId: '',
                sourceSubTypeId: '',
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index+1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                    $set: { 
                      sourceName: 'cmp_source' + (recordsIndex+1),
                      url: fileName
                    }
                  });
                }
              }
              await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
            } catch (e) {
              if (path.extname(link).includes('.pdf')) {
                await axios({
                  method: "get",
                  url: link,
                  responseType: "stream"
                }).then(async function (resp) {
                  
                  let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_'+ index+1;
                  }                    
                  let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                  let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
                  console.log('s3FileObject', s3FileObject);
                  await CompanySources.create({
                    companyId: '',
                    sourceTypeId: '',
                    sourceSubTypeId: '',
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index+1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                        $set: { 
                          sourceName: 'cmp_source' + (recordsIndex+1),
                          url: fileName
                        }
                      });
                    }
                  }
                  await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
                })
                .catch(async (error) => {
                  await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
                });
              } else {
                try {
                  await page.goto(link);
                  let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                  console.log('matchingRecords length', matchingRecords.length);
                  let fileName = '', publicationDate = '', fiscalYear = '';
                  if (matchingRecords.length > 0) {
                    fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                    try {
                      publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                    } catch (error) {
                      publicationDate = new Date();
                    }
                    fiscalYear = matchingRecords[0].year;
                  } else {
                    fileName = 'cmp_source_'+ index+1;
                  }                  
                  let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                  let s3FileObject = await storeFileInS3(actualFile, fileName+'.png', 'image/png');
                  console.log('s3FileObject', s3FileObject);
                  await CompanySources.create({
                    companyId: '',
                    sourceTypeId: '',
                    sourceSubTypeId: '',
                    isMultiYear: false,
                    isMultiSource: false,
                    sourceUrl: link,
                    sourceFile: fileName,
                    publicationDate: publicationDate,
                    fiscalYear: fiscalYear,
                    name: 'cmp_source' + index+1,
                    newSourceTypeName: '',
                    newSubSourceTypeName: '',
                    status: true
                  });
                  for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                    let recordObject = matchingRecords[recordsIndex];
                    if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                      await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                        $set: { 
                          sourceName: 'cmp_source' + (recordsIndex+1),
                          url: fileName
                        }
                      });
                    }
                  }
                  await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
                } catch (err) {
                  await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
                }
              }
            }
          }
        } else {
          try {
            await page.goto(link);
            let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
            console.log('matchingRecords length', matchingRecords.length);
            let fileName = '', publicationDate = '', fiscalYear = '';
            if (matchingRecords.length > 0) {
              fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
              try {
                publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
              } catch (error) {
                publicationDate = new Date();
              }
              fiscalYear = matchingRecords[0].year;
            } else {
              fileName = 'cmp_source_'+ index+1;
            }
            let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
            let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
            console.log('s3FileObject', s3FileObject);
            await CompanySources.create({
              companyId: '',
              sourceTypeId: '',
              sourceSubTypeId: '',
              isMultiYear: false,
              isMultiSource: false,
              sourceUrl: link,
              sourceFile: fileName,
              publicationDate: publicationDate,
              fiscalYear: fiscalYear,
              name: 'cmp_source' + index+1,
              newSourceTypeName: '',
              newSubSourceTypeName: '',
              status: true
            });
            for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
              let recordObject = matchingRecords[recordsIndex];
              if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                  $set: { 
                    sourceName: 'cmp_source' + (recordsIndex+1),
                    url: fileName
                  }
                });
              }
            }
            await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
          } catch (e) {
            if (path.extname(link).includes('.pdf')) {
              await axios({
                method: "get",
                url: link,
                responseType: "stream"
              }).then(async function (resp) {
                
                let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_'+ index+1;
                }
                console.log('resp.data', resp.data);
                // let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
                let actualFile = fs.writeFileSync(`./${fileName}.pdf`, resp.data);
                console.log('actualFile', actualFile);
                let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
                console.log('s3FileObject', s3FileObject);
                await CompanySources.create({
                  companyId: '',
                  sourceTypeId: '',
                  sourceSubTypeId: '',
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: s3FileObject.Location,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index+1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                      $set: { 
                        sourceName: 'cmp_source' + (recordsIndex+1),
                        url: fileName
                      }
                    });
                  }
                }
                await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
              })
              .catch(async (error) => {
                await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
              });
            } else {
              try {
                await page.goto(link);
                let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
                console.log('matchingRecords length', matchingRecords.length);
                let fileName = '', publicationDate = '', fiscalYear = '';
                if (matchingRecords.length > 0) {
                  fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                  try {
                    publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                  } catch (error) {
                    publicationDate = new Date();
                  }
                  fiscalYear = matchingRecords[0].year;
                } else {
                  fileName = 'cmp_source_'+ index+1;
                }
                let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
                let s3FileObject = await storeFileInS3(actualFile, fileName+'.png', 'image/png');
                console.log('s3FileObject', s3FileObject);
                await CompanySources.create({
                  companyId: '',
                  sourceTypeId: '',
                  sourceSubTypeId: '',
                  isMultiYear: false,
                  isMultiSource: false,
                  sourceUrl: link,
                  sourceFile: fileName,
                  publicationDate: publicationDate,
                  fiscalYear: fiscalYear,
                  name: 'cmp_source' + index+1,
                  newSourceTypeName: '',
                  newSubSourceTypeName: '',
                  status: true
                });
                for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                  let recordObject = matchingRecords[recordsIndex];
                  if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                    await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                      $set: { 
                        sourceName: 'cmp_source' + (recordsIndex+1),
                        url: fileName
                      }
                    });
                  }
                }
                await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
              } catch (err) {
                await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
              }
            }
          }
        }
      } else {
        try {
          await page.goto(link);
          let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
          console.log('matchingRecords length', matchingRecords.length);
          let fileName = '', publicationDate = '', fiscalYear = '';
          if (matchingRecords.length > 0) {
            fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
            try {
              publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
            } catch (error) {
              publicationDate = new Date();
            }
            fiscalYear = matchingRecords[0].year;
          } else {
            fileName = 'cmp_source_'+ index+1;
          }
          let actualFile = await page.pdf({ path: `./${fileName}.pdf`, format: 'A4' });
          let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
          console.log('s3FileObject', s3FileObject);
          await CompanySources.create({
            companyId: '',
            sourceTypeId: '',
            sourceSubTypeId: '',
            isMultiYear: false,
            isMultiSource: false,
            sourceUrl: link,
            sourceFile: fileName,
            publicationDate: publicationDate,
            fiscalYear: fiscalYear,
            name: 'cmp_source' + index+1,
            newSourceTypeName: '',
            newSubSourceTypeName: '',
            status: true
          });
          for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
            let recordObject = matchingRecords[recordsIndex];
            if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
              await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                $set: { 
                  sourceName: 'cmp_source' + (recordsIndex+1),
                  url: fileName
                }
              });
            }
          }
          await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
        } catch (e) {
          if (path.extname(link).includes('.pdf')) {
            await axios({
              method: "get",
              url: link,
              responseType: "stream"
            }).then(async function (resp) {
              
              let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_'+ index+1;
              }
              let actualFile = resp.data.pipe(fs.createWriteStream(`./${fileName}.pdf`));
              let s3FileObject = await storeFileInS3(actualFile, fileName+'.pdf', 'application/pdf');
              console.log('s3FileObject', s3FileObject);
              await CompanySources.create({
                companyId: '',
                sourceTypeId: '',
                sourceSubTypeId: '',
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index+1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                    $set: { 
                      sourceName: 'cmp_source' + (recordsIndex+1),
                      url: fileName
                    }
                  });
                }
              }
              await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
            })
            .catch(async (error) => {
              await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
            });
          } else {
            try {
              await page.goto(link);
              
              let matchingRecords = await StandaloneDatapoints.find({url: url, status: true}).populate('companyId');
              console.log('matchingRecords length', matchingRecords.length);
              let fileName = '', publicationDate = '', fiscalYear = '';
              if (matchingRecords.length > 0) {
                fileName = matchingRecords[0].companyId.cmieProwessCode + '_' + 'cmp_source_' + (index+1);
                try {
                  publicationDate = getJsDateFromExcel(matchingRecords[0].publicationDate);
                } catch (error) {
                  publicationDate = new Date();
                }
                fiscalYear = matchingRecords[0].year;
              } else {
                fileName = 'cmp_source_'+ index+1;
              }
              let actualFile = await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
              let s3FileObject = await storeFileInS3(actualFile, fileName+'.png', 'image/png');
              console.log('s3FileObject', s3FileObject);
              await CompanySources.create({
                companyId: '',
                sourceTypeId: '',
                sourceSubTypeId: '',
                isMultiYear: false,
                isMultiSource: false,
                sourceUrl: link,
                sourceFile: fileName,
                publicationDate: publicationDate,
                fiscalYear: fiscalYear,
                name: 'cmp_source' + index+1,
                newSourceTypeName: '',
                newSubSourceTypeName: '',
                status: true
              });
              for (let recordsIndex = 0; recordsIndex < matchingRecords.length; recordsIndex++) {
                let recordObject = matchingRecords[recordsIndex];
                if (recordObject.sourceName != "" || recordObject.sourceName != " ") {
                  await StandaloneDatapoints.updateOne({ _id: recordObject.id}, { 
                    $set: { 
                      sourceName: 'cmp_source' + (recordsIndex+1),
                      url: fileName
                    }
                  });
                }
              }
              await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isDownloaded: true, isCounted: true } });
            } catch (err) {
              await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
            }
          }
        }
      }  
    } else {
      await StandaloneDatapoints.updateMany({url: url, status: true}, { $set: { isCounted: true } });
    }
  }
  await browser.close();
  return res.status(200).json({status: "200", message: "Completed successfully!"});
}

async function validateURL(link) {
  if (link.indexOf("http://") == 0 || link.indexOf("https://") == 0) {
    console.log("The link has http or https.");
    return true;
  } else{
    console.log("The link doesn't have http or https.");
    return false;
  }
}

async function storeFileInS3(actualFile, fileName, contentType) {
  console.log('actualFile', actualFile, 'fileName', fileName, 'contentType', contentType);
  // let file = fs.createReadStream(actualFile.path);
  // let file = fs.readFileSync(actualFile.path);
  // file.on('open', () => {
  //   console.log('OPEN')
  // });
  // file.on('end', () => {
  //   console.log('END')
  // });
  // file.on('close', () => {
  //   console.log('CLOSE')
  // });
  console.log('file', file);
  return new Promise(function (resolve, reject) {
    const params = {
      Bucket: 'company-sources',
      Key: fileName,
      Body: actualFile.buffer,
      ContentType: contentType,
      ACL: 'public-read'
    };
    console.log('params', params);
    s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err)
      } else {
        resolve(data);
      }
    });
  })
}