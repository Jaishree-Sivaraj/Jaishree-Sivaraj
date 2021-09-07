import multer from 'multer'
import XLSX from 'xlsx'
import _ from 'lodash'
import {
  getJsDateFromExcel
} from 'excel-date-to-js'
import mongo from 'mongodb'
import {
  success,
  notFound,
  authorOrAdmin
} from '../../services/response/'
import {
  StandaloneDatapoints
} from '.'
import {
  Companies
} from '../companies'
import {
  Datapoints
} from '../datapoints'
import {
  ClientTaxonomy
} from '../clientTaxonomy'
import {
  BoardMembersMatrixDataPoints
} from '../boardMembersMatrixDataPoints'
import {
  KmpMatrixDataPoints
} from '../kmpMatrixDataPoints'
import {
  object
} from 'mongoose/lib/utils'
import {
  Errors
} from '../error'
import {
  ErrorDetails
} from '../errorDetails'
import {
  Categories
} from '../categories'
import {
  TaskAssignment
} from '../taskAssignment'

var utils = require('../../services/utils/aws-s3')

export const create = ({
  user,
  bodymen: {
    body
  }
}, res, next) =>
  StandaloneDatapoints.create({
    ...body,
    createdBy: user
  })
    .then((standaloneDatapoints) => standaloneDatapoints.view(true))
    .then(success(res, 201))
    .catch(next)


var companyESG = multer.diskStorage({ //multers disk shop photos storage settings
  destination: function (req, file, cb) {
    cb(null, __dirname + '/uploads');
  },
  filename: function (req, file, cb) {
    var datetimestamp = Date.now();
    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
  }
});
var upload = multer({ //multer settings
  storage: companyESG,
  fileFilter: function (req, file, callback) { //file filter
    if (['xls', 'xlsx', 'xlsm'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
      return callback(new Error('Wrong extension type'));
    }
    callback(null, true);
  }
}).fields([{
  name: 'file',
  maxCount: 198
}]);

function alphaToNum(alpha) {
  var i = 0,
    num = 0,
    len = alpha.length;
  for (i; i < len; i++) {
    num = num * 26 + alpha.charCodeAt(i) - 0x40;
  }
  return num - 1;
}

function numToAlpha(num) {
  var alpha = '';
  for (num; num >= 0; num = parseInt(num / 26, 10) - 1) {
    alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
  }
  return alpha;
}

export const uploadCompanyESGFiles = async (req, res, next) => {
  const userDetail = req.user;
  const errorDetails = [];
  try {
    upload(req, res, async function (err) {
      if (err) {
        res.status('400').json({
          status: "400",
          error_code: 1,
          err_desc: err
        });
        return;
      }
      let allFilesObject = [];
      let missingFiles = [];
      if (req.files.file.length >= 0) {
        if (req.files.file.length % 3 == 0) {
          for (let index = 0; index < req.files.file.length; index++) {
            let parsedSheetObject = [];
            const filePath = req.files.file[index].path;
            var workbook = XLSX.readFile(filePath, {
              sheetStubs: false,
              defval: ''
            });
            var sheet_name_list = workbook.SheetNames;

            sheet_name_list.forEach(function (currentSheetName) {
              if (currentSheetName != 'Sheet3' && currentSheetName != 'SFDR') {
                //getting the complete sheet
                var worksheet = workbook.Sheets[currentSheetName];
                var idx, allColumnNames = [];
                var rangeNum = worksheet['!ref'].split(':').map(function (val) {
                  return alphaToNum(val.replace(/[0-9]/g, ''));
                })
                var start = rangeNum[0];
                var end = rangeNum[1] + 1;
                for (idx = start; idx < end; idx++) {
                  allColumnNames.push(numToAlpha(idx));
                }
                let headerRowsNumber = [];
                if (currentSheetName.toLowerCase() == 'matrix-directors' || currentSheetName.toLowerCase() == 'matrix-kmp') {
                  let headersIndexDetails = _.filter(worksheet, (object, index) => {
                    if (object.v == "Category") {
                      headerRowsNumber.push(parseInt(index.substring(1)));
                      return index;
                    }
                  });
                }
                var headers = {};
                var headers1 = {}, headers2 = {};
                var data = [];
                if (currentSheetName.toLowerCase() == 'matrix-directors' || currentSheetName.toLowerCase() == 'matrix-kmp') {
                  // for (const [cellIndex, [key, cellId]] of Object.entries(Object.entries(worksheet))) {
                  // for (let cellId=0; cellId < worksheet.length; cellId++) {
                  for (const cellId in worksheet) {
                    let keys = Object.keys(worksheet);
                    let nextIndex = keys.indexOf(cellId) + 1;
                    let nextItemKey = keys[nextIndex];
                    // let nextCellId = worksheet[Number(cellIndex)+1];
                    let nextCellId = nextItemKey;
                    if (cellId[0] === "!") continue;
                    //parse out the column, row, and value
                    // var col = cellId.substring(0, 1);  
                    var colStringName = cellId.replace(/[0-9]/g, '');
                    var col = colStringName;
                    var nextColStringName = nextCellId.replace(/[0-9]/g, '');
                    var nextCol = nextColStringName;
                    // var row = parseInt(cellId.substring(1));  
                    var row = parseInt(cellId.match(/(\d+)/));
                    var value = worksheet[cellId].v;
                    //store header names
                    if (currentSheetName.toLowerCase() == 'matrix-directors') {
                      if (row == 1) {
                        if (value != "Error types and definitions") {
                          if (isNaN(value)) {
                            headers[col] = value.replace('\r\n', ' ');
                          }
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 32) {
                        if (isNaN(value)) {
                          headers1[col] = value.replace('\r\n', ' ');
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 63) {
                        if (isNaN(value)) {
                          headers2[col] = value.replace('\r\n', ' ');
                        }
                        // storing the header names
                        continue;
                      }
                      //pushing board members values to headers, headers1 and headers2
                      if (row > headerRowsNumber[1] && row != 1 && row > 32 && row < 63) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          if (headers1['A']) {
                            if (data[row][headers1['A']]) {
                              //take all column names in an array
                              let currentColumnIndex = allColumnNames.indexOf(col);
                              let previousColumnIndex = currentColumnIndex - 1;
                              let nextColumnIndex = currentColumnIndex + 1;
                              data[row][headers1[col]] = value;
                              if (!data[row][headers1[allColumnNames[previousColumnIndex]]] && data[row][headers1[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                                data[row][headers1[allColumnNames[previousColumnIndex]]] = '';
                              }
                              if (!data[row][headers1[allColumnNames[nextColumnIndex]]]) {
                                data[row][headers1[allColumnNames[nextColumnIndex]]] = '';
                                let nextCellId = allColumnNames[nextColumnIndex] + row;
                                if (nextCellId) {
                                  let expectedNextCol = allColumnNames[nextColumnIndex];
                                  if (nextCol != expectedNextCol) {
                                    let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
                                    let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
                                    let difference = indexOfActualNextCol - indexOfExpectedNextCol;
                                    if (difference > 1) {
                                      for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
                                        data[row][headers1[allColumnNames[inx]]] = '';
                                      }
                                    } else {
                                      for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
                                        data[row][headers1[allColumnNames[inx]]] = '';
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers1[col]] = value.replace('\r\n', ' ');
                          } else {
                            data[row][headers1[col]] = value;
                          }
                        }
                      } else if (row > headerRowsNumber[1] && row != 1 && row > 63) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          if (headers2['A']) {
                            if (data[row][headers2['A']]) {
                              //take all column names in an array
                              let currentColumnIndex = allColumnNames.indexOf(col);
                              let previousColumnIndex = currentColumnIndex - 1;
                              let nextColumnIndex = currentColumnIndex + 1;
                              data[row][headers2[col]] = value;
                              if (!data[row][headers2[allColumnNames[previousColumnIndex]]] && data[row][headers2[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                                data[row][headers2[allColumnNames[previousColumnIndex]]] = '';
                              }
                              if (!data[row][headers2[allColumnNames[nextColumnIndex]]]) {
                                data[row][headers2[allColumnNames[nextColumnIndex]]] = '';
                                let nextCellId = allColumnNames[nextColumnIndex] + row;
                                if (nextCellId) {
                                  let expectedNextCol = allColumnNames[nextColumnIndex];
                                  if (nextCol != expectedNextCol) {
                                    let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
                                    let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
                                    let difference = indexOfActualNextCol - indexOfExpectedNextCol;
                                    if (difference > 1) {
                                      for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
                                        data[row][headers2[allColumnNames[inx]]] = '';
                                      }
                                    } else {
                                      for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
                                        data[row][headers2[allColumnNames[inx]]] = '';
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers2[col]] = value.replace('\r\n', ' ');
                          } else {
                            data[row][headers2[col]] = value;
                          }
                        }
                      } else {
                        if (!data[row]) {
                          data[row] = {};
                          data[row][headers[col]] = '';
                        }

                        if (col != 'A') {
                          if (headers['A']) {
                            if (data[row][headers['A']]) {
                              //take all column names in an array
                              let currentColumnIndex = allColumnNames.indexOf(col);
                              let previousColumnIndex = currentColumnIndex - 1;
                              let nextColumnIndex = currentColumnIndex + 1;
                              data[row][headers[col]] = value;
                              if (!data[row][headers[allColumnNames[previousColumnIndex]]] && data[row][headers[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                                data[row][headers[allColumnNames[previousColumnIndex]]] = '';
                              }
                              if (!data[row][headers[allColumnNames[nextColumnIndex]]]) {
                                data[row][headers[allColumnNames[nextColumnIndex]]] = '';
                                let nextCellId = allColumnNames[nextColumnIndex] + row;
                                if (nextCellId) {
                                  let expectedNextCol = allColumnNames[nextColumnIndex];
                                  if (nextCol != expectedNextCol) {
                                    let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
                                    let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
                                    let difference = indexOfActualNextCol - indexOfExpectedNextCol;
                                    if (difference > 1) {
                                      for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
                                        data[row][headers[allColumnNames[inx]]] = '';
                                      }
                                    } else {
                                      for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
                                        data[row][headers[allColumnNames[inx]]] = '';
                                      }
                                    }
                                  }
                                }
                                // if (!worksheet[nextCellId]) {
                                //   worksheet[nextCellId] = { t: "", v: "", w: "" };                          
                                // }
                              }
                            }
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers[col]] = value.replace('\r\n', ' ');
                          } else {
                            data[row][headers[col]] = value;
                          }
                        }
                      }
                    } else {
                      if (row == 1) {
                        if (value != "Error types and definitions") {
                          if (isNaN(value)) {
                            headers[col] = value.replace('\r\n', ' ');
                          }
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 12) {
                        if (isNaN(value)) {
                          headers1[col] = value.replace('\r\n', ' ');
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 23) {
                        if (isNaN(value)) {
                          headers2[col] = value.replace('\r\n', ' ');
                        }
                        // storing the header names
                        continue;
                      }
                      //pushing kmp members values to headers, headers1 and headers2
                      if (row > headerRowsNumber[1] && row != 1 && row > 12 && row < 23) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          if (headers1['A']) {
                            if (data[row][headers1['A']]) {
                              //take all column names in an array
                              let currentColumnIndex = allColumnNames.indexOf(col);
                              let previousColumnIndex = currentColumnIndex - 1;
                              let nextColumnIndex = currentColumnIndex + 1;
                              data[row][headers1[col]] = value;
                              if (!data[row][headers1[allColumnNames[previousColumnIndex]]] && data[row][headers1[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                                data[row][headers1[allColumnNames[previousColumnIndex]]] = '';
                              }
                              if (!data[row][headers1[allColumnNames[nextColumnIndex]]]) {
                                data[row][headers1[allColumnNames[nextColumnIndex]]] = '';
                                let nextCellId = allColumnNames[nextColumnIndex] + row;
                                if (nextCellId) {
                                  let expectedNextCol = allColumnNames[nextColumnIndex];
                                  if (nextCol != expectedNextCol) {
                                    let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
                                    let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
                                    let difference = indexOfActualNextCol - indexOfExpectedNextCol;
                                    if (difference > 1) {
                                      for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
                                        data[row][headers1[allColumnNames[inx]]] = '';
                                      }
                                    } else {
                                      for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
                                        data[row][headers1[allColumnNames[inx]]] = '';
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers1[col]] = value.replace('\r\n', ' ');
                          } else {
                            data[row][headers1[col]] = value;
                          }
                        }
                      } else if (row > headerRowsNumber[1] && row != 1 && row > 23) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          if (headers2['A']) {
                            if (data[row][headers2['A']]) {
                              //take all column names in an array
                              let currentColumnIndex = allColumnNames.indexOf(col);
                              let previousColumnIndex = currentColumnIndex - 1;
                              let nextColumnIndex = currentColumnIndex + 1;
                              data[row][headers2[col]] = value;
                              if (!data[row][headers2[allColumnNames[previousColumnIndex]]] && data[row][headers2[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                                data[row][headers2[allColumnNames[previousColumnIndex]]] = '';
                              }
                              if (!data[row][headers2[allColumnNames[nextColumnIndex]]]) {
                                data[row][headers2[allColumnNames[nextColumnIndex]]] = '';
                                let nextCellId = allColumnNames[nextColumnIndex] + row;
                                if (nextCellId) {
                                  let expectedNextCol = allColumnNames[nextColumnIndex];
                                  if (nextCol != expectedNextCol) {
                                    let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
                                    let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
                                    let difference = indexOfActualNextCol - indexOfExpectedNextCol;
                                    if (difference > 1) {
                                      for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
                                        data[row][headers2[allColumnNames[inx]]] = '';
                                      }
                                    } else {
                                      for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
                                        data[row][headers2[allColumnNames[inx]]] = '';
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers2[col]] = value.replace('\r\n', ' ');
                          } else {
                            data[row][headers2[col]] = value;
                          }
                        }
                      } else {
                        if (!data[row]) {
                          data[row] = {};
                          data[row][headers[col]] = '';
                        }

                        if (col != 'A') {
                          if (headers['A']) {
                            if (data[row][headers['A']]) {
                              //take all column names in an array
                              let currentColumnIndex = allColumnNames.indexOf(col);
                              let previousColumnIndex = currentColumnIndex - 1;
                              let nextColumnIndex = currentColumnIndex + 1;
                              data[row][headers[col]] = value;
                              if (!data[row][headers[allColumnNames[previousColumnIndex]]] && data[row][headers[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                                data[row][headers[allColumnNames[previousColumnIndex]]] = '';
                              }
                              if (!data[row][headers[allColumnNames[nextColumnIndex]]]) {
                                data[row][headers[allColumnNames[nextColumnIndex]]] = '';
                                let nextCellId = allColumnNames[nextColumnIndex] + row;
                                if (nextCellId) {
                                  let expectedNextCol = allColumnNames[nextColumnIndex];
                                  if (nextCol != expectedNextCol) {
                                    let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
                                    let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
                                    let difference = indexOfActualNextCol - indexOfExpectedNextCol;
                                    if (difference > 1) {
                                      for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
                                        data[row][headers[allColumnNames[inx]]] = '';
                                      }
                                    } else {
                                      for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
                                        data[row][headers[allColumnNames[inx]]] = '';
                                      }
                                    }
                                  }
                                }
                                // if (!worksheet[nextCellId]) {
                                //   worksheet[nextCellId] = { t: "", v: "", w: "" };                          
                                // }
                              }
                            }
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers[col]] = value.replace('\r\n', ' ');
                          } else {
                            data[row][headers[col]] = value;
                          }
                        }
                      }
                    }
                    // if(headerRowsNumber.includes(row) && row != 1){
                  }
                  //drop those first two rows which are empty
                  data.shift();
                  data.shift();
                  parsedSheetObject.push(data);

                } else {
                  for (const cellId in worksheet) {
                    if (cellId[0] === "!") continue;
                    //parse out the column, row, and value
                    var col = cellId.substring(0, 1);
                    var row = parseInt(cellId.substring(1));
                    var value = worksheet[cellId].v;
                    //store header names
                    if (row == 1) {
                      headers[col] = value;
                      // storing the header names
                      continue;
                    }

                    if (!data[row] && value) data[row] = {};
                    if (col != 'A') {
                      if (headers['A']) {
                        if (data[row][headers['A']]) {
                          //take all column names in an array
                          let currentColumnIndex = allColumnNames.indexOf(col);
                          let previousColumnIndex = currentColumnIndex - 1;
                          let nextColumnIndex = currentColumnIndex + 1;
                          data[row][headers[col]] = value;
                          if (!data[row][headers[allColumnNames[previousColumnIndex]]] && data[row][headers[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
                            data[row][headers[allColumnNames[previousColumnIndex]]] = '';
                          }
                          if (!data[row][headers[allColumnNames[nextColumnIndex]]]) {
                            data[row][headers[allColumnNames[nextColumnIndex]]] = '';
                          }
                        }
                      }
                    } else {
                      data[row][headers[col]] = value;
                    }
                  }
                  //drop those first two rows which are empty
                  data.shift();
                  data.shift();
                  parsedSheetObject.push(data);
                }
              }
            });
            allFilesObject.push(parsedSheetObject)
          }

          //processing the extracted json from excel sheets start

          let allCompanyInfos = [];
          let allStandaloneDetails = [];
          let allBoardMemberMatrixDetails = [];
          let allKmpMatrixDetails = [];
          //loop no of files uploaded
          for (let allFilesArrayIndex = 0; allFilesArrayIndex < allFilesObject.length; allFilesArrayIndex++) {
            //iterate each file
            let noOfSheetsInAnFile = allFilesObject[allFilesArrayIndex].length;

            //loop no of sheets in a file
            let currentCompanyName = '';
            for (let singleFileIndex = 0; singleFileIndex < noOfSheetsInAnFile; singleFileIndex++) {
              //iterate each sheet in a file
              let noOfRowsInASheet = allFilesObject[allFilesArrayIndex][singleFileIndex].length;
              for (let rowIndex = 0; rowIndex < noOfRowsInASheet; rowIndex++) {
                if (singleFileIndex == 0 && rowIndex == 0) {
                  if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]) {
                    allCompanyInfos.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]);
                    currentCompanyName = allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['CIN'];
                  }
                } else if (noOfSheetsInAnFile > 2) {
                  if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex] && allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['DP Code']) {
                    allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex].CIN = currentCompanyName;
                    if (singleFileIndex == 2) {
                      allBoardMemberMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
                    } else if (singleFileIndex == 3) {
                      allKmpMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
                    } else if (singleFileIndex == 1) {
                      allStandaloneDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
                    }
                  }
                } else {
                  if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex] && allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['DP Code']) {
                    allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex].CIN = currentCompanyName;
                    allStandaloneDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
                  }
                }
              }
            }
          }
          let clientTaxonomyId = await ClientTaxonomy.findOne({
            taxonomyName: "Acuite"
          });
          const companiesToBeAdded = _.uniqBy(allCompanyInfos, 'CIN');
          for (let cinIndex = 0; cinIndex < companiesToBeAdded.length; cinIndex++) {
            let categoriesToBeCheck = _.filter(allStandaloneDetails, function (object) {
              if (object.CIN.replace('\r\n', '') == companiesToBeAdded[cinIndex].CIN.replace('\r\n', '')) {
                return object;
              }
            });
            let categoryLength = _.uniqBy(categoriesToBeCheck, 'Category');
            if (categoryLength.length != 3) {
              let missingFileObject = {
                companyName: companiesToBeAdded[cinIndex]['Company Name'],
                countOfMissingFile: 3 - categoryLength.length
              }
              missingFiles.push(missingFileObject);
            }
          }
          if (missingFiles.length < 1) {

            let categoriesObject = await Categories.find({
              status: true
            });
            let taskObject = await TaskAssignment.find({
              status: true
            });
            let errorTypeDetails = await Errors.find({
              status: true
            });

            const structuredCompanyDetails = [];
            for (let index = 0; index < companiesToBeAdded.length; index++) {
              const item = companiesToBeAdded[index];
              let nicString = item['NIC Code'].toString();
              let companyObject = {
                companyName: item['Company Name'],
                cin: item['CIN'].replace('\r\n', ''),
                nicCode: item['NIC Code'],
                nic: nicString.substring(0, 2),
                nicIndustry: item['NIC industry'],
                isinCode: item['ISIN Code'],
                cmieProwessCode: item['CMIE/Prowess Code'],
                socialAnalystName: item['Analyst Name'],
                socialQAName: item['QA Name'],
                clientTaxonomyId: clientTaxonomyId._id,
                status: true,
                createdBy: userDetail
              }
              await Companies.updateOne({
                cin: item['CIN'].replace('\r\n', '').trim()
              }, {
                $set: companyObject
              }, {
                upsert: true
              });
              structuredCompanyDetails.push(companyObject);
            }
            const datapointList = await Datapoints.find({
              status: true
            }).populate('updatedBy').populate('keyIssueId').populate('functionId');
            const companiesList = await Companies.find({
              status: true
            }).populate('createdBy');
            let filteredBoardMemberMatrixDetails = _.filter(allBoardMemberMatrixDetails, (x) => {
              if (x) {
                if (Object.keys(x)[0] != undefined) {
                  if (Object.keys(x)[0].toString() != Object.values(x)[0]) {
                    return x;
                  }
                }
              }
            });

            let filteredKmpMatrixDetails = _.filter(allKmpMatrixDetails, (x) => {
              if (x) {
                if (Object.keys(x)[0] != undefined) {
                  if (Object.keys(x)[0].toString() != Object.values(x)[0]) {
                    return x;
                  }
                }
              }
            });
            const structuredStandaloneDetails = allStandaloneDetails.map(function (item) {
              let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace('\r\n', ''));
              let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
              let responseValue, hasError;
              let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace('\r\n', '').toLowerCase());
              let taskObjectValue = taskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id);
              if (item['Error Type'] != undefined && item['Error Type'] != "") {
                let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace('\r\n', ''))
                hasError = true;
                let errorListObject = {
                  datapointId: datapointObject[0] ? datapointObject[0].id : null,
                  dpCode: item['DP Code'] ? item['DP Code'] : '',
                  year: item['Fiscal Year'],
                  companyId: companyObject[0] ? companyObject[0].id : null,
                  categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
                  taskId: taskObjectValue[0] ? taskObjectValue[0].id : null,
                  errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
                  raisedBy: "",
                  comments: [],
                  errorLoggedDate: Date.now(),
                  errorCaughtByRep: [],
                  errorStatus: true,
                  isErrorAccepted: false,
                  isErrorRejected: false,
                  rejectComment: "",
                  status: true,
                  createdBy: userDetail
                }
                errorDetails.push(errorListObject);
              } else {
                hasError = false
              }

              if (String(item['Response']).length > 0) {
                if (item['Response'] == "" || item['Response'] == " " || item['Response'] == undefined) {
                  if (item['Response'] == "0" || item['Response'] == 0) {
                    responseValue = item['Response'];
                  } else {
                    responseValue = "NA";
                  }
                } else {
                  responseValue = item['Response'];
                }
              } else {
                responseValue = "NA";
              }
              return {
                categoryName: item['Category'],
                keyIssueName: item['Key Issues'],
                dpCode: item['DP Code'] ? item['DP Code'] : '',
                datapointId: datapointObject[0] ? datapointObject[0].id : null,
                year: item['Fiscal Year'],
                fiscalYearEndDate: item['Fiscal Year End Date'],
                response: responseValue,
                companyId: companyObject[0] ? companyObject[0].id : null,
                sourceName: item['Source name'],
                url: item['URL'] ? item['URL'].toString() : '',
                pageNumber: item['Page number'],
                publicationDate: item['Publication date'],
                textSnippet: item['Text snippet'],
                screenShot: item['Screenshot (in png)'],
                sourceFileType: 'pdf',
                filePathway: item['File pathway'],
                commentCalculations: item['Comments/Calculations'],
                internalFileSource: item['Internal file source'],
                comments: [],
                collectionStatus: false,
                verificationStatus: false,
                hasError: hasError,
                hasCorrection: true,
                performanceResult: '',
                standaloneStatus: '',
                taskId: taskObjectValue[0] ? taskObjectValue[0].id : null,
                submittedBy: '',
                submittedDate: '',
                standaradDeviation: '',
                average: '',
                activeStatus: '',
                lastModifiedDate: '',
                modifiedBy: '',
                isSubmitted: false,
                status: true,
                createdBy: userDetail
              }
            });
            var insertedCompanies = _.filter(companiesList, (item) =>
              _.some(structuredCompanyDetails, (obj) => item.cin === obj.cin));

            let insertedCompanyIds = [];
            _.forEach(insertedCompanies, (company) => {
              insertedCompanyIds.push(company.id);
            });

            let distinctObjectByYears = _.uniqBy(structuredStandaloneDetails, 'year');
            let distinctNicObjects = _.uniqBy(structuredCompanyDetails, 'nic');
            let distinctNics = [];
            _.forEach(distinctNicObjects, (obj) => {
              distinctNics.push(obj.nic);
            });
            let distinctYears = [];
            _.forEach(distinctObjectByYears, (obj) => {
              distinctYears.push(obj.year);
            });

            let boardMembersList = [];
            let inactiveBoardMembersList = [];
            let kmpMembersList = [];
            const structuredBoardMemberMatrixDetails = filteredBoardMemberMatrixDetails.map(async function (item) {
              let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace('\r\n', ''));
              let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
              let allKeyNamesList = Object.keys(item);
              const boardMembersNameList = _.filter(allKeyNamesList, function (keyName) {
                let trimmedKeyName = keyName.replace(/\s/g, "").replace('\r\n', '').toLowerCase();
                return trimmedKeyName != "category" && trimmedKeyName != "keyissues" && trimmedKeyName != "dpcode" &&
                  trimmedKeyName != "indicator" && trimmedKeyName != "description" && trimmedKeyName != "datatype" &&
                  trimmedKeyName != "unit" && trimmedKeyName != "fiscalyear" && trimmedKeyName != "fiscalyearenddate" &&
                  trimmedKeyName != "cin" && trimmedKeyName != "sourcename" && trimmedKeyName != "url" &&
                  trimmedKeyName != "pagenumber" && trimmedKeyName != "publicationdate" && trimmedKeyName != "textsnippet" &&
                  trimmedKeyName != "screenshot(inpng)" && trimmedKeyName != "worddoc(.docx)" && trimmedKeyName != "excel(.xlsx)" &&
                  trimmedKeyName != "excel(.xlxsx)" && trimmedKeyName != "pdf" && trimmedKeyName != "filepathway(ifany)" &&
                  trimmedKeyName != "comments/calculations" && trimmedKeyName != "dataverification" &&
                  trimmedKeyName != "errortype" && trimmedKeyName != "errorcomments" && trimmedKeyName != "internalfilesource" &&
                  trimmedKeyName != "errorstatus" && trimmedKeyName != "analystcomments" && trimmedKeyName != "additionalcomments" &&
                  trimmedKeyName != "errortypesanddefinitions" && trimmedKeyName != "errortypesanddefinations" && trimmedKeyName != "count" && trimmedKeyName != "20" &&
                  trimmedKeyName != "t2.evidencenotsubstantive" && trimmedKeyName != "0" && trimmedKeyName != "7" &&
                  trimmedKeyName != "goodtohave" && trimmedKeyName != "t2.others/noerror" && trimmedKeyName != "percentile" &&
                  trimmedKeyName != "whenitisnotananalysterror/itisjustasuggestion" && trimmedKeyName != "undefined" && trimmedKeyName.length > 2;
              });
              let hasError;
              let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace('\r\n', '').toLowerCase());
              let taskObjectValue = taskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id);
              if (item['Error Type'] != undefined && item['Error Type'] != "") {
                let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace('\r\n', ''))
                hasError = true;
                let errorListObject = {
                  datapointId: datapointObject[0] ? datapointObject[0].id : null,
                  dpCode: item['DP Code'] ? item['DP Code'] : '',
                  year: item['Fiscal Year'],
                  companyId: companyObject[0] ? companyObject[0].id : null,
                  categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
                  taskId: taskObjectValue[0] ? taskObjectValue[0].id : null,
                  errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
                  raisedBy: "",
                  comments: [],
                  errorLoggedDate: Date.now(),
                  errorCaughtByRep: [],
                  errorStatus: true,
                  isErrorAccepted: false,
                  isErrorRejected: false,
                  rejectComment: "",
                  status: true,
                  createdBy: userDetail
                }
                errorDetails.push(errorListObject);
              } else {
                hasError = false
              }
              _.forEach(boardMembersNameList, function (value) {
                let memberDetail = {
                  memberName: value,
                  dpCode: item['DP Code'] ? item['DP Code'] : '',
                  response: item[value],
                  datapointId: datapointObject[0] ? datapointObject[0].id : null,
                  companyId: companyObject[0] ? companyObject[0].id : null,
                  year: item['Fiscal Year'],
                  fiscalYearEndDate: item['Fiscal Year End Date'],
                  sourceName: item['Source name'],
                  url: item['URL'] ? item['URL'].toString() : '',
                  pageNumber: item['Page number'],
                  publicationDate: item['Publication date'],
                  textSnippet: item['Text snippet'],
                  screenShot: item['Screenshot (in png)'],
                  sourceFileType: 'pdf',
                  filePathway: item['File pathway'],
                  commentCalculations: item['Comments/Calculations'],
                  internalFileSource: item['Internal file source'],
                  collectionStatus: false,
                  verificationStatus: false,
                  comments: [],
                  hasError: hasError,
                  hasCorrection: true,
                  taskId: taskObjectValue[0] ? taskObjectValue[0].id : null,
                  memberStatus: true,
                  status: true,
                  createdBy: userDetail
                };
                boardMembersList.push(memberDetail);
                if (item['DP Code'] == 'BOIR018') {
                  if ((item[value].toString().toLowerCase() != 'n' || item[value].toString().toLowerCase() != 'no') && item[value].toString() != '' && item[value] != undefined && item[value] != null) {

                    let cessaDate;
                    try {
                      cessaDate = getJsDateFromExcel(item[value]);
                    } catch (error) {
                      return res.status(500).json({
                        status: "500",
                        message: `Found invalid date format in ${companyObject ? companyObject.companyName : 'a company'}, please correct and try again!`
                      })
                    }
                    let currentDate = new Date();
                    if (cessaDate < currentDate) {
                      inactiveBoardMembersList.push(memberDetail)
                    }
                  }
                }
              });
              return {
                datapointId: datapointObject[0] ? datapointObject[0].id : null,
                companyId: companyObject[0] ? companyObject[0].id : null,
                year: item['Fiscal Year'],
                response: (item['Response'] == '0' || item['Response'] == 0 || item['Response']) ? item['Response'] : '',
                fiscalYearEndDate: item['Fiscal Year End Date'],
                status: true,
                createdBy: userDetail
              }
            });

            _.forEach(inactiveBoardMembersList, function (object) {
              let indexToUpdate = _.findIndex(boardMembersList, object);
              if (indexToUpdate >= 0) {
                boardMembersList[indexToUpdate].memberStatus = false;
              }
              let matchingMembers = boardMembersList.filter((obj) => {
                if (obj.memberName == object.memberName && obj.year == object.year && obj.companyId == object.companyId) {
                  return obj;
                }
              });
              if (matchingMembers.length > 0) {
                for (let idx = 0; idx < matchingMembers.length; idx++) {
                  let idxToUpdate = _.findIndex(boardMembersList, matchingMembers[idx]);
                  if (indexToUpdate >= 0) {
                    boardMembersList[idxToUpdate].memberStatus = false;
                  }
                }
              }
            });

            const structuredKmpMatrixDetails = filteredKmpMatrixDetails.map(async function (item) {
              let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace('\r\n', ''));
              let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
              let allKeyNamesList = Object.keys(item);
              const kmpMembersNameList = _.filter(allKeyNamesList, function (keyName) {
                let trimmedKeyName = keyName.replace(/\s/g, "").replace('\r\n', '').toLowerCase();
                return trimmedKeyName != "category" && trimmedKeyName != "keyissues" && trimmedKeyName != "dpcode" &&
                  trimmedKeyName != "indicator" && trimmedKeyName != "description" && trimmedKeyName != "datatype" &&
                  trimmedKeyName != "unit" && trimmedKeyName != "fiscalyear" && trimmedKeyName != "fiscalyearenddate" &&
                  trimmedKeyName != "cin" && trimmedKeyName != "sourcename" && trimmedKeyName != "url" &&
                  trimmedKeyName != "pagenumber" && trimmedKeyName != "publicationdate" && trimmedKeyName != "textsnippet" &&
                  trimmedKeyName != "screenshot(inpng)" && trimmedKeyName != "worddoc(.docx)" && trimmedKeyName != "excel(.xlsx)" &&
                  trimmedKeyName != "excel(.xlxsx)" && trimmedKeyName != "pdf" && trimmedKeyName != "filepathway(ifany)" &&
                  trimmedKeyName != "comments/calculations" && trimmedKeyName != "dataverification" &&
                  trimmedKeyName != "errortype" && trimmedKeyName != "errorcomments" && trimmedKeyName != "internalfilesource" &&
                  trimmedKeyName != "errorstatus" && trimmedKeyName != "analystcomments" && trimmedKeyName != "additionalcomments" &&
                  trimmedKeyName != "errortypesanddefinitions" && trimmedKeyName != "errortypesanddefinations" && trimmedKeyName != "count" && trimmedKeyName != "20" &&
                  trimmedKeyName != "t2.evidencenotsubstantive" && trimmedKeyName != "0" && trimmedKeyName != "7" &&
                  trimmedKeyName != "goodtohave" && trimmedKeyName != "t2.others/noerror" && trimmedKeyName != "percentile" &&
                  trimmedKeyName != "whenitisnotananalysterror/itisjustasuggestion" && trimmedKeyName != "undefined" && trimmedKeyName.length > 2;
              });
              let hasError;
              let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace('\r\n', '').toLowerCase());
              let taskObjectValue = taskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id);
              if (item['Error Type'] != undefined && item['Error Type'] != "") {
                let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace('\r\n', ''))
                hasError = true;
                let errorListObject = {
                  datapointId: datapointObject[0] ? datapointObject[0].id : null,
                  dpCode: item['DP Code'] ? item['DP Code'] : '',
                  year: item['Fiscal Year'],
                  companyId: companyObject[0] ? companyObject[0].id : null,
                  categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
                  taskId: taskObjectValue[0] ? taskObjectValue[0].id : null,
                  errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
                  raisedBy: "",
                  comments: [],
                  errorLoggedDate: Date.now(),
                  errorCaughtByRep: [],
                  errorStatus: true,
                  isErrorAccepted: false,
                  isErrorRejected: false,
                  rejectComment: "",
                  status: true,
                  createdBy: userDetail
                }
                errorDetails.push(errorListObject);
              } else {
                hasError = false
              }
              let currentMemberStatus;
              _.forEach(kmpMembersNameList, function (value) {
                let memberDetail = {
                  memberName: value,
                  response: item[value],
                  dpCode: item['DP Code'] ? item['DP Code'] : '',
                  memberStatus: true,
                  datapointId: datapointObject[0] ? datapointObject[0].id : null,
                  companyId: companyObject[0] ? companyObject[0].id : null,
                  year: item['Fiscal Year'],
                  fiscalYearEndDate: item['Fiscal Year End Date'],
                  sourceName: item['Source name'],
                  url: item['URL'] ? item['URL'].toString() : '',
                  pageNumber: item['Page number'],
                  publicationDate: item['Publication date'],
                  textSnippet: item['Text snippet'],
                  screenShot: item['Screenshot (in png)'],
                  sourceFileType: 'pdf',
                  filePathway: item['File pathway'],
                  commentCalculations: item['Comments/Calculations'],
                  internalFileSource: item['Internal file source'],
                  collectionStatus: false,
                  verificationStatus: false,
                  hasCorrection: true,
                  comments: [],
                  hasError: hasError,
                  taskId: taskObjectValue[0] ? taskObjectValue[0].id : null,
                  status: true,
                  createdBy: userDetail
                }
                kmpMembersList.push(memberDetail);
              });

              return {
                datapointId: datapointObject[0] ? datapointObject[0].id : null,
                companyId: companyObject[0] ? companyObject[0].id : null,
                year: item['Fiscal Year'],
                response: (item['Response'] == '0' || item['Response'] == 0 || item['Response']) ? item['Response'] : '',
                fiscalYearEndDate: item['Fiscal Year End Date'],
                status: true,
                createdBy: userDetail
              }
            });

            let dpToFind = await Datapoints.findOne({
              code: "BOIP007"
            });
            let dpMapping = [{
              "BOCR013": "MACR023"
            }, {
              "BOCR014": "MACR024"
            }, {
              "BOCR015": "MACR025"
            }, {
              "BOCR016": "MACR026"
            }, {
              "BOCR018": "MACR029"
            }, {
              "BODR005": "MASR008"
            }, {
              "BOIR021": "MASR009"
            }, {
              "BOSP003": "MASP002"
            }, {
              "BOSP004": "MASP003"
            }, {
              "BOSR009": "MASR007"
            }];
            let bmmDpsToFind = await Datapoints.find({
              code: {
                $in: ["BOCR013", "BOCR014", "BOCR015", "BOCR016", "BOCR018", "BODR005", "BOIR021", "BOSP003", "BOSP004", "BOSR009"]
              }
            });
            let kmpDpsToUpdate = await Datapoints.find({
              code: {
                $in: ["MACR023", "MACR024", "MACR025", "MACR026", "MACR029", "MASR008", "MASR009", "MASP002", "MASP003", "MASR007"]
              }
            });
            if (dpToFind) {
              for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
                const year = distinctYears[yearIndex];
                for (let companyIndex = 0; companyIndex < insertedCompanyIds.length; companyIndex++) {
                  const companyId = insertedCompanyIds[companyIndex];
                  let executiveMembersList = _.filter(boardMembersList, function (object) {
                    if (object.datapointId == dpToFind.id && object.companyId == companyId && object.year == year && object.response == 'Yes') {
                      return object;
                    }
                  });
                  if (executiveMembersList.length > 0) {
                    for (let executiveMemberIndex = 0; executiveMemberIndex < executiveMembersList.length; executiveMemberIndex++) {
                      const executiveMemberObject = executiveMembersList[executiveMemberIndex];

                      for (let findIndex = 0; findIndex < bmmDpsToFind.length; findIndex++) {
                        const bmmDpObject = bmmDpsToFind[findIndex];
                        let kmpDatapointCode = dpMapping.find((obj) => obj[bmmDpObject.code]);
                        let matchingKmpObject = kmpDpsToUpdate.find((obj) => obj.code == kmpDatapointCode[bmmDpObject.code]);
                        let responseToUpdate = _.filter(boardMembersList, function (obj) {
                          return obj.datapointId == bmmDpObject.id &&
                            obj.companyId == companyId &&
                            obj.year == year &&
                            obj.memberName == executiveMemberObject.memberName;
                        });
                        if (responseToUpdate.length > 0) {
                          let memberDetail = {
                            memberName: executiveMemberObject.memberName,
                            response: (responseToUpdate[0].response == '0' || responseToUpdate[0].response == 0 || responseToUpdate[0].response) ? responseToUpdate[0].response : '',
                            memberStatus: true,
                            datapointId: matchingKmpObject ? matchingKmpObject.id : null,
                            companyId: companyId,
                            year: year,
                            fiscalYearEndDate: executiveMemberObject.fiscalYearEndDate,
                            status: true,
                            createdBy: userDetail
                          };
                          kmpMembersList.push(memberDetail)
                        }
                      }
                    }
                  }
                }
              }
            }

            var actualDPList = _.concat(structuredStandaloneDetails, boardMembersList, kmpMembersList);
            let missingDPList = [],
              expectedDPList = [],
              missingDatapointsDetails = [],
              missingDPsLength = [];
            let standaloneDatapointsList = await Datapoints.find({
              dataCollection: "Yes",
              functionId: {
                "$ne": '609bcceb1d64cd01eeda092c'
              }
            })
            //actualDPlist, expectedDPlist(548) 
            for (let expectedDPIndex = 0; expectedDPIndex < standaloneDatapointsList.length; expectedDPIndex++) {
              expectedDPList.push(standaloneDatapointsList[expectedDPIndex].code)
            }
            for (let companyIdIndex = 0; companyIdIndex < insertedCompanies.length; companyIdIndex++) {
              for (let year = 0; year < distinctYears.length; year++) {
                let missingDPs = _.filter(expectedDPList, (expectedCode) => !_.some(actualDPList, (obj) => expectedCode === obj.dpCode && obj.year == distinctYears[year] && obj.companyId == insertedCompanies[companyIdIndex]._id));
                if (missingDPs.length > 0 && distinctYears[year]) {
                  let missingDPObject = {
                    companyName: insertedCompanies[companyIdIndex].companyName,
                    year: distinctYears[year],
                    missingDPs: missingDPs
                  }
                  // missingDPsLength = _.concat(missingDPsLength,missingDPs);
                  missingDatapointsDetails.push(missingDPObject);
                }
              }
            }
            missingDPList = _.concat(missingDPList, missingDatapointsDetails)
            if (missingDPList.length == 0) {
              await StandaloneDatapoints.updateMany({
                "companyId": {
                  $in: insertedCompanyIds
                },
                "year": {
                  $in: distinctYears
                }
              }, {
                $set: {
                  status: false
                }
              }, {});
              await StandaloneDatapoints.insertMany(structuredStandaloneDetails)
                .then((err, result) => {
                  if (err) {
                    console.log('error', err);
                  } else {
                    //  console.log('result', result);
                  }
                });
              //Marking existing Data as False in BoardMemberMatrixDP 
              await BoardMembersMatrixDataPoints.updateMany({
                "companyId": {
                  $in: insertedCompanyIds
                },
                "year": {
                  $in: distinctYears
                }
              }, {
                $set: {
                  status: false
                }
              }, {});
              await BoardMembersMatrixDataPoints.insertMany(boardMembersList)
                .then((err, result) => {
                  if (err) {
                    console.log('error', err);
                  } else {
                    // console.log('result', result);
                  }
                });
              await KmpMatrixDataPoints.updateMany({
                "companyId": {
                  $in: insertedCompanyIds
                },
                "year": {
                  $in: distinctYears
                }
              }, {
                $set: {
                  status: false
                }
              }, {});
              await KmpMatrixDataPoints.insertMany(kmpMembersList)
                .then((err, result) => {
                  if (err) {
                    console.log('error', err);
                  } else {
                    //  console.log('result', result);
                  }
                });
              // await ErrorDetails.updateMany({
              //   "companyId": {
              //     $in: insertedCompanyIds
              //   },
              //   "year": {
              //     $in: distinctYears
              //   }
              // }, {
              //   $set: {
              //     status: false
              //   }
              // }, {});
              await ErrorDetails.insertMany(errorDetails).then((err, result) => {
                if (err) {
                  console.log('error', err);
                } else {
                  //  console.log('result', result);
                }
              });
              res.status(200).json({
                status: "200",
                message: "Files upload success",
                companies: insertedCompanies,
                nicList: distinctNics
              });

            } else {
              // let missingDPcodeNames = [];
              // let companyNameForMissedDPs = '';
              // for (let missingDPIndex = 0; missingDPIndex < missingDPList.length; missingDPIndex++) {
              //   let missingDPListId = missingDPList[missingDPIndex].missingDPs;
              //   companyNameForMissedDPs = missingDPList[missingDPIndex].companyName;
              //   for (let missingDPIdIndex = 0; missingDPIdIndex < missingDPListId.length; missingDPIdIndex++) {
              //     _.find(standaloneDatapointsList, (object) => {
              //       if (object.id == missingDPListId[missingDPIdIndex]) {
              //         missingDPcodeNames.push(object.code);
              //       }
              //     })
              //   }
              // }
              // return res.status(400).json({ message: "Missing DP Codes", CompanyName: companyNameForMissedDPs, missingDatapoints: missingDPcodeNames });
              return res.status(400).json({
                status: "400",
                message: "Missing DP Codes",
                missingDatapoints: missingDPList
              });
            }

          } else {
            return res.status(400).json({
              status: "400",
              message: "Files Missing for below companies",
              missingFilesDetails: missingFiles
            });
          }
        } else {
          return res.status(400).json({
            status: "400",
            message: "Some files are missing!, Please upload all files Environment, Social and Governance for a company"
          });

        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "No files for attached!"
        });
      }
    });
  } catch (error) {
    return res.status(403).json({
      message: error.message ? error.message : 'Failed to upload controversy files',
      status: 403
    });
  }
}
export const dataCollection = async ({
  user,
  bodymen: {
    body
  },
  params
}, res, next) => {
  try {
    let taskDetailsObject = await TaskAssignment.findOne({ _id: body.taskId }).populate('companyId').populate('categoryId');
    if (taskDetailsObject.taskStatus == 'Yet to work' || taskDetailsObject.taskStatus == 'Pending') {
      let dpCodesDetails = body.currentData;
      let dpHistoricalDpDetails = body.historicalData;
      let currentYearValues = [...new Set(dpCodesDetails.map(obj => obj.fiscalYear))];
      let historicalDataYear = [...new Set(dpHistoricalDpDetails.map(obj => obj.fiscalYear))];
      if (body.memberType == 'Standalone') {
        for (let index = 0; index < dpCodesDetails.length; index++) {
          let item = dpCodesDetails[index];
          var obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: item['screenShot'], //aws filename
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user
          }
          //for (let index1 = 0; 1 < currentYearValues.length; index1++) {
            //store in s3 bucket with filename
            await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
          let item = dpHistoricalDpDetails[index];
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            status: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
            await StandaloneDatapoints.updateOne({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });

      } else if (body.memberType == 'Board Matrix') {
        for (let index = 0; index < dpCodesDetails.length; index++) {
          let item = dpCodesDetails[index];
          var obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: item['screenShot'], //aws filename
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < currentYearValues.length; index1++) {
            //store in s3 bucket with filename
            await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
          let item = dpHistoricalDpDetails[index];
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            status: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
            await BoardMembersMatrixDataPoints.updateOne({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });
      } else if (body.memberType == 'KMP Matrix') {
        for (let index = 0; index < dpCodesDetails.length; index++) {
          let item = dpCodesDetails[index];
          var obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: item['screenShot'], //aws filename
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < currentYearValues.length; index1++) {
            //store in s3 bucket with filename
            await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
          let item = dpHistoricalDpDetails[index];
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            status: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
            await KmpMatrixDataPoints.updateOne({ companyId: body.companyId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });
      }
    } else if (taskDetailsObject.taskStatus == 'Correction Pending') {
      let dpCodesDetails = body.currentData;
      let dpHistoricalDpDetails = body.historicalData;
      let acceptYearValues = [...new Set(dpCodesDetails.map(obj => obj.fiscalYear))];
      let historicalDataYear = [...new Set(dpHistoricalDpDetails.map(obj => obj.fiscalYear))];
      if (body.memberType == 'Standalone') {
        for (let index = 0; index < dpCodesDetails.length; index++) {
          let item = dpCodesDetails[index];
          var obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: item['screenShot'], //aws filename
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            hasError: false,
            hasCorrection: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user
          }
          let comments = {            
            author: 'Analyst',
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.rejectComment
            }
            if(item.isAccepted == false){
              await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              {$set: {isErrorAccepted: item.isAccepted, comments: comments}});
            } else{              
              await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              {$set: {isErrorAccepted: item.isAccepted}});
            }
            await StandaloneDatapoints.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
          let item = dpHistoricalDpDetails[index];
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            status: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
            await StandaloneDatapoints.updateOne({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });

      } else if (body.memberType == 'Board Matrix') {
        for (let index = 0; index < dpCodesDetails.length; index++) {
          let item = dpCodesDetails[index];
          var obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: item['screenShot'], //aws filename
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            hasError: false,
            hasCorrection: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            createdBy: user
          }
          let comments = {            
            author: 'Analyst',
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.rejectComment
            }
            if(item.isAccepted == false){
              await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              {$set: {isErrorAccepted: item.isAccepted, comments: comments}});
            } else{              
              await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              {$set: {isErrorAccepted: item.isAccepted}});
            }
            await BoardMembersMatrixDataPoints.updateOne({ taskId: body.taskId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
          let item = dpHistoricalDpDetails[index];
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            status: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
            await BoardMembersMatrixDataPoints.updateOne({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });
      } else if (body.memberType == 'KMP Matrix') {
        for (let index = 0; index < dpCodesDetails.length; index++) {
          let item = dpCodesDetails[index];
          var obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: item['screenShot'], //aws filename
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            hasError: false,
            hasCorrection: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            createdBy: user
          }
          let comments = {            
            author: 'Analyst',
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.rejectComment
            }
            if(item.isAccepted == false){
              await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              {$set: {isErrorAccepted: item.isAccepted, comments: comments}});
            } else{              
              await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName,datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              {$set: {isErrorAccepted: item.isAccepted}});
            }
            await KmpMatrixDataPoints.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        for (let index = 0; index < dpHistoricalDpDetails.length; index++) {
          let item = dpHistoricalDpDetails[index];
          let obj = {
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: body.taskId,
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: item['screenShot'],
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            memberStatus: true,
            status: true,
            createdBy: user
          }
         // for (let index1 = 0; 1 < historicalDataYear.length; index1++) {
            await KmpMatrixDataPoints.updateOne({ companyId: body.companyId,memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], status: true },
              { $set: obj }, { upsert: true });
          //}
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });
      }
    }

  } catch (error) {

    return res.status(500).json({
      message: error.message,
      status: 500
    });
  }
}
export const index = ({
  querymen: {
    query,
    select,
    cursor
  }
}, res, next) =>
  StandaloneDatapoints.count(query)
    .then(count => StandaloneDatapoints.find(query, select, cursor)
      .populate('createdBy')
      .populate('companyId')
      .populate('taskId')
      .populate('datapointId')
      .then((standaloneDatapoints) => ({
        count,
        rows: standaloneDatapoints.map((standaloneDatapoints) => standaloneDatapoints.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({
  params
}, res, next) =>
  StandaloneDatapoints.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('taskId')
    .populate('datapointId')
    .then(notFound(res))
    .then((standaloneDatapoints) => standaloneDatapoints ? standaloneDatapoints.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({
  user,
  bodymen: {
    body
  },
  params
}, res, next) =>
  StandaloneDatapoints.findById(params.id)
    .populate('createdBy')
    .populate('companyId')
    .populate('taskId')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((standaloneDatapoints) => standaloneDatapoints ? Object.assign(standaloneDatapoints, body).save() : null)
    .then((standaloneDatapoints) => standaloneDatapoints ? standaloneDatapoints.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({
  user,
  params
}, res, next) =>

  StandaloneDatapoints.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((standaloneDatapoints) => standaloneDatapoints ? standaloneDatapoints.remove() : null)
    .then(success(res, 204))
    .catch(next)
