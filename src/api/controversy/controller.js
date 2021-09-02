import multer from 'multer'
import XLSX from 'xlsx'
import _ from 'lodash'
import moment from 'moment'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Controversy } from '.'
import { Companies } from '../companies'
import { ClientTaxonomy } from '../clientTaxonomy'
import { Datapoints } from '../datapoints'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Controversy.create({ ...body, createdBy: user })
    .then((controversy) => controversy.view(true))
    .then(success(res, 201))
    .catch(next)

export const addNewControversy = async ({ user, bodymen: { body } }, res, next) => {
  try {
    if (body) {
      let lastControversy = await Controversy.findOne({ status: true }).sort({ createdAt: -1 }).limit(1);
      let newTaskNumber = '';
      if (lastControversy && Object.keys(lastControversy).length > 0) {
        let lastTaskNumber = lastControversy.controversyNumber ? lastControversy.controversyNumber.split('CON')[1] : '1';
        newTaskNumber = 'CON' + String(Number(lastTaskNumber) + 1);
      } else {
        newTaskNumber = 'CON1';
      }
      let controversyObject = {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        taskId: body.taskId,
        controversyNumber: newTaskNumber,
        sourceName: body.source.sourceName,
        sourceURL: body.source.url,
        sourcePublicationDate: body.source.publicationDate,
        publicationDate: '',
        response: body.response,
        textSnippet: body.textSnippet,
        pageNumber: body.pageNo,
        screenShot: body.screenShot,
        comments: body.comments,
        controversyDetails: [],
        submittedDate: Date.now(),
        additionalDetails: body.additionalDetails,
        nextReviewDate: body.nextReviewDate,
        status: true,
        createdBy: user
      };
      await Controversy.create(controversyObject)
        .then((controversyDetail) => {
          return res.status(200).json({ status: "200", message: "New controversy created!", data: controversyDetail });
        })
        .catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new controversy!' });
        })
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to create new controversy!' });
  }
}

export const updateControversy = async ({ user, bodymen: { body }, params }, res, next) => {
  try {
    if (body) {
      let controversyObject = {
        datapointId: body.dpCodeId,
        companyId: body.companyId,
        taskId: body.taskId,
        sourceName: body.source.sourceName,
        sourceURL: body.source.url,
        sourcePublicationDate: body.source.publicationDate,
        publicationDate: '',
        response: body.response,
        textSnippet: body.textSnippet,
        pageNumber: body.pageNo,
        screenShot: body.screenShot,
        comments: body.comments,
        controversyDetails: [],
        submittedDate: Date.now(),
        additionalDetails: body.additionalDetails,
        nextReviewDate: body.nextReviewDate,
        status: true,
        createdBy: user
      };
      await Controversy.updateOne({ _id: params.id }, { $set: controversyObject })
        .then((controversyDetail) => {
          return res.status(200).json({ status: "200", message: "Controversy updated!", data: controversyObject });
        })
        .catch((error) => {
          return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to update controversy!' });
        })
    } else {
      return res.status(400).json({ status: "400", message: "Some fields are missing!" });
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message ? error.message : 'Failed to update controversy!' });
  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Controversy.count(query)
    .then(count => Controversy.find(query, select, cursor)
      .populate('createdBy')
      .populate('companyId')
      .populate('datapointId')
      .then((controversies) => ({
        count,
        rows: controversies.map((controversy) => controversy.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Controversy.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('datapointId')
    .then(notFound(res))
    .then((controversy) => controversy ? controversy.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Controversy.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((controversy) => controversy ? Object.assign(controversy, body).save() : null)
    .then((controversy) => controversy ? controversy.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Controversy.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((controversy) => controversy ? controversy.remove() : null)
    .then(success(res, 204))
    .catch(next)

var controversyFiles = multer.diskStorage({ //multers disk shop photos storage settings
  destination: function (req, file, cb) {
    // cb(null, './uploads/')
    console.log('__dirname ', __dirname);
    // console.log('process.env.PWD', process.env.PWD);
    cb(null, __dirname + '/uploads');
  },
  filename: function (req, file, cb) {
    var datetimestamp = Date.now();
    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
  }
});
var upload = multer({ //multer settings
  storage: controversyFiles,
  fileFilter: function (req, file, callback) { //file filter
    if (['xls', 'xlsx', 'xlsm'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
      return callback(new Error('Wrong extension type'));
    }
    callback(null, true);
  }
}).fields([{ name: 'file', maxCount: 25 }]);

export const uploadControversies = async (req, res, next) => {
  const userDetail = req.user;
  try {
    upload(req, res, async function (err) {
      console.log(new Error(err));
      if (err) {
        res.status('400').json({ error_code: 1, err_desc: err });
        return;
      }
      let allFilesObject = [];
      for (let index = 0; index < req.files.file.length; index++) {
        const filePath = req.files.file[index].path;
        var workbook = XLSX.readFile(filePath, { sheetStubs: false, defval: '' });
        var sheet_name_list = workbook.SheetNames;

        sheet_name_list.forEach(function (currentSheetName) {
          console.log('currentSheetName', currentSheetName);
          var worksheet = workbook.Sheets[currentSheetName];
          try {
            var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: " " });
            allFilesObject.push(sheetAsJson);
          } catch (error) {
            return res.status(400).json({ message: error.message })
          }
        })
      }
      let companyDetails = [], controversyDetails = [];
      if (allFilesObject.length > 0) {
        let currentCompanyName;
        let clientTaxonomyId = await ClientTaxonomy.findOne({ taxonomyName: "Acuite" });
        for (let index = 0; index < allFilesObject.length; index++) {
          console.log(allFilesObject[index].length);
          console.log(allFilesObject[index]);
          if (allFilesObject[index].length == 1) {
            let companyObject = {
              companyName: allFilesObject[index][0]['Company Name'],
              cin: allFilesObject[index][0]['CIN'],
              nicCode: allFilesObject[index][0]['NIC Code'],
              nic: allFilesObject[index][0]['NIC Code'].toString().substring(0, 2),
              nicIndustry: allFilesObject[index][0]['NIC industry'],
              isinCode: allFilesObject[index][0]['ISIN Code'],
              cmieProwessCode: allFilesObject[index][0]['CMIE/Prowess Code'],
              socialAnalystName: allFilesObject[index][0]['Analyst Name'],
              socialQAName: allFilesObject[index][0]['QA Name'],
              clientTaxonomyId: clientTaxonomyId.id,
              status: true,
              createdBy: userDetail
            }
            companyDetails.push(companyObject);
            currentCompanyName = allFilesObject[index][0]['Company Name'];
          } else {
            for (let rowIndex = 0; rowIndex < allFilesObject[index].length; rowIndex++) {
              let controversyList = [], responseValue = 0, controversyObject = {};
              let element = allFilesObject[index][rowIndex];
              if (allFilesObject[index][rowIndex]['Response']) {
                if (allFilesObject[index][rowIndex]['Response'].length >= 2) {
                  let currentSourcePublicationDate = '';
                  let sourcePublicationDate;
                  if (allFilesObject[index][rowIndex]['Source Publication Date'].toString().includes("/")) {
                    currentSourcePublicationDate = allFilesObject[index][rowIndex]['Source Publication Date'].toString();
                    // currentSourcePublicationDate = allFilesObject[index][rowIndex]['Source Publication Date'].replace("/", "-");
                    currentSourcePublicationDate = allFilesObject[index][rowIndex]['Source Publication Date'].replace(/\//g, '-');
                    sourcePublicationDate = new Date(moment(currentSourcePublicationDate.split('/').reverse().join('-'), "DD-MM-YYYY").toString()).toLocaleDateString();
                  } else {
                    currentSourcePublicationDate = allFilesObject[index][rowIndex]['Source Publication Date'];
                  }
                  if (!sourcePublicationDate) {
                    try {
                      sourcePublicationDate = getJsDateFromExcel(currentSourcePublicationDate);
                      sourcePublicationDate = new Date(sourcePublicationDate).toLocaleDateString();
                    } catch (error) {
                      console.log(error.message);
                      return res.status(500).json({ message: `Found invalid date format in ${currentCompanyName}, please correct and try again!` })
                    }
                  }
                  controversyList.push({
                    sourceName: allFilesObject[index][rowIndex]['Source name'] ? allFilesObject[index][rowIndex]['Source name'] : '',
                    sourceURL: allFilesObject[index][rowIndex]['URL'] ? allFilesObject[index][rowIndex]['URL'] : '',
                    Textsnippet: allFilesObject[index][rowIndex]['Text snippet'] ? allFilesObject[index][rowIndex]['Text snippet'] : '',
                    sourcePublicationDate: sourcePublicationDate ? sourcePublicationDate : ''
                  })
                  if (allFilesObject[index][rowIndex]['Response'] == "Low") {
                    responseValue = 1;
                  } else if (allFilesObject[index][rowIndex]['Response'] == "Medium") {
                    responseValue = 2;
                  } else if (allFilesObject[index][rowIndex]['Response'] == "High") {
                    responseValue = 3;
                  } else if (allFilesObject[index][rowIndex]['Response'] == "Very high") {
                    responseValue = 4;
                  } else {
                    responseValue = 0;
                  }
                  controversyObject = {
                    companyId: currentCompanyName,
                    datapointId: allFilesObject[index][rowIndex]['DP Code'] ? allFilesObject[index][rowIndex]['DP Code'] : '',
                    year: allFilesObject[index][rowIndex]['Fiscal Year'] ? allFilesObject[index][rowIndex]['Fiscal Year'] : '',
                    response: allFilesObject[index][rowIndex]['Response'] ? allFilesObject[index][rowIndex]['Response'].toString() : '',
                    responseValue: responseValue,
                    controversyDetails: controversyList,
                    comments: [],
                    submittedDate: new Date(),
                    status: true,
                    createdBy: userDetail
                  }
                } else {
                  controversyObject = {
                    companyId: currentCompanyName,
                    datapointId: allFilesObject[index][rowIndex]['DP Code'] ? allFilesObject[index][rowIndex]['DP Code'] : '',
                    year: allFilesObject[index][rowIndex]['Fiscal Year'] ? allFilesObject[index][rowIndex]['Fiscal Year'] : '',
                    response: allFilesObject[index][rowIndex]['Response'] ? allFilesObject[index][rowIndex]['Response'].toString() : '',
                    responseValue: responseValue,
                    submittedDate: new Date(),
                    status: true,
                    createdBy: userDetail
                  }
                }
                let isDpValueExist = controversyDetails.findIndex(obj => obj.companyId == currentCompanyName && obj.datapointId == controversyObject.datapointId && obj.year == controversyObject.year)
                if (isDpValueExist > -1) {
                  if (!controversyDetails[isDpValueExist].controversyDetails && controversyList[0]) {
                    controversyDetails[isDpValueExist].controversyDetails = [controversyList[0]];
                  } else {
                    if (controversyDetails[isDpValueExist].controversyDetails && controversyList[0]) {
                      controversyDetails[isDpValueExist].controversyDetails.push(controversyList[0]);
                    }
                  }
                  if (controversyDetails[isDpValueExist].response) {
                    const previousResponseValue = controversyDetails[isDpValueExist].responseValue;
                    const currentResponseValue = controversyObject.responseValue;
                    if (currentResponseValue > previousResponseValue) {
                      controversyDetails[isDpValueExist].responseValue = currentResponseValue;
                      controversyDetails[isDpValueExist].response = allFilesObject[index][rowIndex]['Response'].toString();
                    }
                  } else {
                    controversyDetails[isDpValueExist].response = controversyObject.response;
                  }
                } else {
                  controversyDetails.push(controversyObject);
                }
              } else {
                let controversyObject = {
                  companyId: currentCompanyName,
                  datapointId: allFilesObject[index][rowIndex]['DP Code'] ? allFilesObject[index][rowIndex]['DP Code'] : '',
                  year: allFilesObject[index][rowIndex]['Fiscal Year'] ? allFilesObject[index][rowIndex]['Fiscal Year'] : '',
                  response: allFilesObject[index][rowIndex]['Response'] ? allFilesObject[index][rowIndex]['Response'].toString() : '',
                  responseValue: responseValue,
                  submittedDate: new Date(),
                  status: true,
                  createdBy: userDetail
                }
                controversyDetails.push(controversyObject);
              }
            }
          }
        }
      }
      let uniqueCompanies = _.uniq(companyDetails, 'cin');
      console.log(companyDetails);
      //find if found update else insert in companies collection
      let uniqueInsertedCinList = [];
      if (uniqueCompanies.length > 0) {
        for (let index = 0; index < uniqueCompanies.length; index++) {
          await Companies.updateOne({ cin: uniqueCompanies[index].cin }, { $set: uniqueCompanies[index] }, { upsert: true });
          uniqueInsertedCinList.push(uniqueCompanies[index].cin);
        }
      }
      let insertedCompanies = await Companies.find({ cin: { $in: uniqueInsertedCinList } });
      let insertedCompanyIds = await Companies.find({ cin: { $in: uniqueInsertedCinList } }).distinct('_id');
      let allDatapointsList = await Datapoints.find({ status: true });
      await Controversy.updateMany({
        "companyId": { $in: insertedCompanyIds }
      }, { $set: { status: false } }, {});

      controversyDetails.map(obj => {
        insertedCompanies.find(item => {
          if (item.companyName === obj.companyId) {
            obj.companyId = item.id;
            return;
          }
        });
        allDatapointsList.find(item => {
          if (item.code === obj.datapointId) {
            obj.datapointId = item.id;
          }
        })
      });

      await Controversy.insertMany(controversyDetails)
        .then((err, result) => {
          if (err) {
            console.log('error', err);
          } else {
            //  console.log('result', result);
          }
        });
      return res.json({ message: "Files upload success", companies: insertedCompanies, data: controversyDetails });
    });
  } catch (error) {
    return res.status(403).json({
      message: error.message ? error.message : 'Failed to upload controversy files',
      status: 403
    });
  }
}

export const generateJson = async ({ params, user }, res, next) => {
  let companyDetails = await Companies.findOne({ _id: params.companyId, status: true });
  if (companyDetails) {
    let companyControversyYears = await Controversy.find({ companyId: params.companyId, status: true }).distinct('year');
    let responseObject = {
      companyName: companyDetails.companyName,
      CIN: companyDetails.cin,
      data: [],
      status: 200
    };
    if (companyControversyYears.length > 0) {
      for (let yearIndex = 0; yearIndex < companyControversyYears.length; yearIndex++) {
        const year = companyControversyYears[yearIndex];
        let yearwiseData = {
          year: year,
          companyName: companyDetails.companyName,
          Data: []
        };
        let companyControversiesYearwise = await Controversy.find({ companyId: params.companyId, year: year, status: true })
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
            yearwiseData.Data.push(dataObject);
          }
        }
        responseObject.data.push(yearwiseData)
      }
    }
    return res.status(200).json({ message: "Successfully retrieved!", data: responseObject });
  } else {
    return res.status(500).json({ message: "Failed to fetch details", data: [] });
  }
}

export const fetchDatapointControversy = async ({ params, user }, res, next) => {
  if (params.companyId && params.datapointId) {
    await Datapoints.findById(params.datapointId)
      .populate('categoryId')
      .populate('keyIssueId')
      .populate('functionId')
      .then(async (datapointDetail) => {
        let responseObject = {
          dpCode: datapointDetail.code,
          dpCodeId: datapointDetail.id,
          indicator: datapointDetail.name,
          description: datapointDetail.description,
          keyIssue: datapointDetail.keyIssueId.keyIssueName,
          inputValues: [{ value: 'Very High', label: 'Very High' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }, { value: 'No', label: 'No' }],
          dataType: datapointDetail.dataType,
          avgResponse: '',
          controversyList: [],
          additionalDetails: []
        };
        await Controversy.find({ companyId: params.companyId, datapointId: params.datapointId, status: true })
          .populate('createdBy')
          .populate('companyId')
          .populate('datapointId')
          .then(async(controversyList) => {
            let clientTaxonomyId = '';
            if (controversyList.length > 0) {
              clientTaxonomyId = controversyList[0].datapointId.clientTaxonomyId;
            } else {
              clientTaxonomyId = null;
            }
            let clienttaxonomyFields = await ClientTaxonomy.find({ _id: clientTaxonomyId }).distinct('fields');
            let displayFields = clienttaxonomyFields.filter(obj => obj.toDisplay == true && obj.applicableFor != 'Only Collection');
            let requiredFields = [
              "categoryCode",
              "categoryName",
              "code",
              "comments",
              "dataCollection",
              "dataCollectionGuide",
              "description",
              "dpType",
              "errorType",
              "finalUnit",
              "functionType",
              "hasError",
              "industryRelevant",
              "isPriority",
              "keyIssueCode",
              "keyIssueName",
              "name",
              "normalizedBy",
              "pageNumber",
              "percentile",
              "polarity",
              "publicationDate",
              "reference",
              "response",
              "screenShot",
              "signal",
              "sourceName",
              "standaloneOrMatrix",
              "textSnippet",
              "themeCode",
              "themeName",
              "unit",
              "url",
              "weighted",
              "year"
            ];
            if (controversyList && controversyList.length > 0) {
              let responseValue = 0, responseList = [0];
              for (let cIndex = 0; cIndex < controversyList.length; cIndex++) {
                let controversyObject = {};
                controversyObject.id = controversyList[cIndex].id;
                controversyObject.controversyNumber = controversyList[cIndex].controversyNumber ? controversyList[cIndex].controversyNumber : '-';
                controversyObject.dpCode = datapointDetail.code;
                controversyObject.dpCodeId = datapointDetail.id;
                controversyObject.indicator = datapointDetail.indicator;
                controversyObject.description = datapointDetail.description;
                controversyObject.dataType = datapointDetail.dataType;
                controversyObject.textSnippet = controversyList[cIndex].textSnippet ? controversyList[cIndex].textSnippet : '';
                controversyObject.pageNo = controversyList[cIndex].pageNumber ? controversyList[cIndex].pageNumber : '';
                controversyObject.screenShot = controversyList[cIndex].screenShot ? controversyList[cIndex].screenShot : '';
                controversyObject.response = controversyList[cIndex].response ? controversyList[cIndex].response : '';
                // controversyObject.additionalDetails = controversyList[cIndex].additionalDetails ? controversyList[cIndex].additionalDetails : '';
                controversyObject.nextReviewDate = controversyList[cIndex].nextReviewDate ? controversyList[cIndex].nextReviewDate : '';
                controversyObject.additionalDetails = [];
                
                for (let dIndex = 0; dIndex < displayFields.length; dIndex++) {
                  if(!requiredFields.includes(displayFields[dIndex].fieldName)){
                    let optionValues = [], optionVal = '', currentValue;
                    if(displayFields[dIndex].inputType == 'Select'){
                      let options = displayFields[dIndex].inputValues.split(',');
                      if(options.length > 0){
                        for (let optIndex = 0; optIndex < options.length; optIndex++) {
                          optionValues.push({
                            value: options[optIndex],
                            label: options[optIndex]
                          });                        
                        }
                      } else {
                        optionValues = [];
                      }
                    } else {
                      optionVal = displayFields[dIndex].inputValues;
                    }
                    let controversyDtl = controversyList[cIndex];
                    if(displayFields[dIndex].inputType == 'Static'){
                      currentValue = controversyDtl[displayFields[dIndex].fieldName];
                    } else {
                      if(displayFields[dIndex].inputType == 'Select'){
                        currentValue = { value: controversyDtl.additionalDetails ? controversyDtl.additionalDetails[displayFields[dIndex].fieldName] : '', label: controversyDtl.additionalDetails ? controversyDtl.additionalDetails[displayFields[dIndex].fieldName] : '' };
                      } else {
                        currentValue = controversyDtl.additionalDetails ? controversyDtl.additionalDetails[displayFields[dIndex].fieldName] : '';
                      }
                    }
                    controversyObject.additionalDetails.push({
                      fieldName: displayFields[dIndex].fieldName,
                      name: displayFields[dIndex].name,
                      value: currentValue ? currentValue: '',
                      inputType: displayFields[dIndex].inputType,
                      inputValues: optionValues.length > 0 ? optionValues : optionVal
                    })
                    let foundObject = responseObject.additionalDetails.find((obj) => obj.fieldName == displayFields[dIndex].fieldName)
                    if (!foundObject) {
                      responseObject.additionalDetails.push({
                        fieldName: displayFields[dIndex].fieldName,
                        name: displayFields[dIndex].name,
                        value: '',
                        inputType: displayFields[dIndex].inputType,
                        inputValues: optionValues.length > 0 ? optionValues : optionVal
                      })                      
                    }
                  }                
                }

                if (controversyObject.response == 'Very High') {
                  responseValue = 4;
                } else if (controversyObject.response == 'High') {
                  responseValue = 3;
                } else if (controversyObject.response == 'Medium') {
                  responseValue = 2;
                } else if (controversyObject.response == 'Low') {
                  responseValue = 1;
                } else {
                  responseValue = 0;
                }
                responseList.push(responseValue);
                controversyObject.source = {
                  sourceName: controversyList[cIndex].sourceName ? controversyList[cIndex].sourceName : '',
                  url: controversyList[cIndex].sourceURL ? controversyList[cIndex].sourceURL : '',
                  publicationDate: controversyList[cIndex].sourcePublicationDate ? controversyList[cIndex].sourcePublicationDate : ''
                }
                controversyObject.comments = controversyList[cIndex].comments ? controversyList[cIndex].comments : [];
                responseObject.controversyList.push(controversyObject);
              }
              let greatestResponseValue = responseList.sort((a, b) => a - b)[responseList.length - 1];
              if (greatestResponseValue == 4) {
                responseObject.avgResponse = 'Very High';
              } else if (greatestResponseValue == 3) {
                responseObject.avgResponse = 'High';
              } else if (greatestResponseValue == 2) {
                responseObject.avgResponse = 'Medium';
              } else if (greatestResponseValue == 1) {
                responseObject.avgResponse = 'Low';
              } else {
                responseObject.avgResponse = '';
              }
              return res.status(200).json({ status: "200", message: "Datapoint Controversies retrieved successfully!", data: responseObject });
            } else {
              return res.status(200).json({ status: "500", message: "No controversy added yet!", data: responseObject });
            }
          })
          .catch((error) => {
            return res.status(500).json({ status: "500", message: "Controversy not found for the company and dpcode!" })
          })
      })
      .catch((error) => { return res.status(500).json({ status: "500", message: 'Datapoint not found!' }) })
  } else {
    return res.status(404).json({ status: "404", message: "Controversy not found for the company and dpcode!" })
  }
}