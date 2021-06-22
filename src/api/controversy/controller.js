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
              clientTaxonomyId: clientTaxonomyId._id,
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
                if (allFilesObject[index][rowIndex]['Response'].length > 2) {
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
                  }
                  controversyObject = {
                    companyId: currentCompanyName,
                    datapointId: allFilesObject[index][rowIndex]['DP Code'] ? allFilesObject[index][rowIndex]['DP Code'] : '',
                    year: allFilesObject[index][rowIndex]['Fiscal Year'] ? allFilesObject[index][rowIndex]['Fiscal Year'] : '',
                    response: allFilesObject[index][rowIndex]['Response'] ? allFilesObject[index][rowIndex]['Response'].toString() : '',
                    responseValue: responseValue,
                    controversyDetails: controversyList,
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
              Year: element.year,
              DPCode: element.datapointId.code,
              Response: element.response,
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