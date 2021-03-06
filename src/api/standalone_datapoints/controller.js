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
import { CompaniesTasks } from '../companies_tasks'
import { CompanySources } from '../companySources'
import { storeFileInS3 } from "../../services/utils/aws-s3"

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
                            headers[col] = value.replace(/[\s\r\n]/g, ' ');
                          }
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 32) {
                        if (isNaN(value)) {
                          headers1[col] = value.replace(/[\s\r\n]/g, ' ');
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 63) {
                        if (isNaN(value)) {
                          headers2[col] = value.replace(/[\s\r\n]/g, ' ');
                        }
                        // storing the header names
                        continue;
                      }
                      //pushing board members values to headers, headers1 and headers2
                      if (row > headerRowsNumber[1] && row != 1 && row > 32 && row < 63) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          try {
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
                          } catch (error) {
                            return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers1[col]] = value.replace(/[\s\r\n]/g, ' ');
                          } else {
                            data[row][headers1[col]] = value;
                          }
                        }
                      } else if (row > headerRowsNumber[1] && row != 1 && row > 63) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          try {
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
                          } catch (error) {
                            return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers2[col]] = value.replace(/[\s\r\n]/g, ' ');
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
                          try {
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
                          } catch (error) {
                            return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the headers" })
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers[col]] = value.replace(/[\s\r\n]/g, ' ');
                          } else {
                            data[row][headers[col]] = value;
                          }
                        }
                      }
                    } else {
                      if (row == 1) {
                        if (value != "Error types and definitions") {
                          if (isNaN(value)) {
                            headers[col] = value.replace(/[\s\r\n]/g, ' ');
                          }
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 12) {
                        if (isNaN(value)) {
                          headers1[col] = value.replace(/[\s\r\n]/g, ' ');
                        }
                        // storing the header names
                        continue;
                      } else if (headerRowsNumber.includes(row) && row != 1 && row == 23) {
                        if (isNaN(value)) {
                          headers2[col] = value.replace(/[\s\r\n]/g, ' ');
                        }
                        // storing the header names
                        continue;
                      }
                      //pushing kmp members values to headers, headers1 and headers2
                      if (row > headerRowsNumber[1] && row != 1 && row > 12 && row < 23) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          try {
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
                          } catch (error) {
                            return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers1[col]] = value.replace(/[\s\r\n]/g, ' ');
                          } else {
                            data[row][headers1[col]] = value;
                          }
                        }
                      } else if (row > headerRowsNumber[1] && row != 1 && row > 23) {
                        if (!data[row]) data[row] = {};
                        if (col != 'A') {
                          try {
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
                          } catch (error) {
                            return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers2[col]] = value.replace(/[\s\r\n]/g, ' ');
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
                          try {
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
                          } catch (error) {
                            return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
                          }
                        } else {
                          if (isNaN(value)) {
                            data[row][headers[col]] = value.replace(/[\s\r\n]/g, ' ');
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
            taxonomyName: "ESGDS"
          });
          const companiesToBeAdded = _.uniqBy(allCompanyInfos, 'CIN');
          for (let cinIndex = 0; cinIndex < companiesToBeAdded.length; cinIndex++) {
            let categoriesToBeCheck = _.filter(allStandaloneDetails, function (object) {
              if (object.CIN.replace(/[\s\r\n]/g, '') == companiesToBeAdded[cinIndex].CIN.replace(/[\s\r\n]/g, '')) {
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
              clientTaxonomyId: "60c76f299def09f5ef0dca5c",
              status: true
            });
            let taskObject = await TaskAssignment.find({
              status: true
            });
            let companyTaskObject = await CompaniesTasks.find({
              status: true,
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
                cin: item['CIN'].replace(/[\s\r\n]/g, ''),
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
                clientTaxonomyId: "60c76f299def09f5ef0dca5c",
                cin: item['CIN'].replace(/[\s\r\n]/g, '').trim()
              }, {
                $set: companyObject
              }, {
                upsert: true
              });
              structuredCompanyDetails.push(companyObject);
            }
            const datapointList = await Datapoints.find({
              clientTaxonomyId: clientTaxonomyId,
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
            let structuredStandaloneDetails = [];
            for (let strStdIindex = 0; strStdIindex < allStandaloneDetails.length; strStdIindex++) {
              try {
                const item = allStandaloneDetails[strStdIindex];
                let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace(/[\r\n]/g, ''));
                let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
                let responseValue, hasError;
                let categoriesObjectValues = categoriesObject.filter(obj => obj?.categoryName.toLowerCase() == item['Category'].replace(/[\r\n]/g, '').toLowerCase())
                let companyTaskObjectValue = companyTaskObject.filter(obj => obj?.companyId == companyObject[0]?.id && obj?.categoryId == categoriesObjectValues[0]?.id && obj?.year == item['Fiscal Year']);
                if (item['Error Type'] != undefined && item['Error Type'] != "") {
                  let errorTypeObject = errorTypeDetails.filter(obj => obj?.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
                  hasError = true;
                  // console.log("companyTaskObjectValue[0].taskId", companyTaskObjectValue[0].taskId);
                  let errorListObject = {
                    datapointId: datapointObject[0] ? datapointObject[0].id : null,
                    dpCode: item['DP Code'] ? item['DP Code'] : '',
                    year: item['Fiscal Year'],
                    companyId: companyObject[0] ? companyObject[0].id : null,
                    categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
                    taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
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
                let structuredStandaloneDetailsObject = {
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
                  isRestated: item['isRestated'],
                  restatedForYear: item['restatedForYear'],
                  restatedInYear: item['restatedInYear'],
                  restatedValue: item['restatedValue'],
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
                  hasError: false,
                  hasCorrection: false,
                  performanceResult: '',
                  standaloneStatus: '',
                  taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
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
                structuredStandaloneDetails.push(structuredStandaloneDetailsObject);
              } catch (error) {
                return res.status(500).json({ status: "500", message: error.message ? error.message : "Invalid category name please check!" });
              }
            }
              
            for (let stdIndex = 0; stdIndex < structuredStandaloneDetails.length; stdIndex++) {
              let item = structuredStandaloneDetails[stdIndex];
              let companyObject = companiesList.filter(obj => obj.id === item['companyId']);
              let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['categoryName'].toLowerCase());
              let companyTaskObjectValue = companyTaskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id && obj.year == item['year']);
              if (companyTaskObjectValue.length > 0 && companyTaskObjectValue[0].taskId) {
                await CompaniesTasks.updateOne({taskId: companyTaskObjectValue[0].taskId, year: item['year']}, { $set: { canGenerateJson: true, isJsonGenerated: false, isOverAllCompanyTaskStatus: true, completedDate: new Date() } })
                .catch((error) => {
                  return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to update company task for standalone datapoints!" });
                })
              }
            }
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
            for (let filterIndex = 0; filterIndex < filteredBoardMemberMatrixDetails.length; filterIndex++) {
              try {
                let item = filteredBoardMemberMatrixDetails[filterIndex];
                let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace(/[\s\r\n]/g, ''));
                let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
                let allKeyNamesList = Object.keys(item);
                const boardMembersNameList = _.filter(allKeyNamesList, function (keyName) {
                  let trimmedKeyName = keyName.replace(/\s/g, "").replace(/[\s\r\n]/g, '').toLowerCase();
                  return trimmedKeyName != "category" && trimmedKeyName != "keyissues" && trimmedKeyName != "dpcode" &&
                    trimmedKeyName != "indicator" && trimmedKeyName != "description" && trimmedKeyName != "datatype" &&
                    trimmedKeyName != "unit" && trimmedKeyName != "fiscalyear" && trimmedKeyName != "fiscalyearenddate" &&
                    trimmedKeyName != "cin" && trimmedKeyName != "sourcename" && trimmedKeyName != "url" &&
                    trimmedKeyName != "pagenumber" && trimmedKeyName != "publicationdate" && trimmedKeyName != "textsnippet" &&  //TODO
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
                let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace(/[\r\n]/g, '').toLowerCase());
                let companyTaskObjectValue = companyTaskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id && obj.year == item['Fiscal Year']);
                if (item['Error Type'] != undefined && item['Error Type'] != "") {
                  let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
                  hasError = true;
                  let errorListObject = {
                    datapointId: datapointObject[0] ? datapointObject[0].id : null,
                    dpCode: item['DP Code'] ? item['DP Code'] : '',
                    year: item['Fiscal Year'],
                    companyId: companyObject[0] ? companyObject[0].id : null,
                    categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
                    taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
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
                let promiseArr = [];
                for(let boardMemIndex = 0; boardMemIndex<boardMembersNameList.length; boardMemIndex++) {
                  let value = boardMembersNameList[boardMemIndex];
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
                    isRestated: item['isRestated'],
                    restatedForYear: item['restatedForYear'],
                    restatedInYear: item['restatedInYear'],
                    restatedValue: item['restatedValue'],
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
                    hasError: false,
                    hasCorrection: false,
                    taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
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
                          message: `Found invalid date format in ${companyObject[0] ? companyObject[0].companyName : 'a company'}, please correct and try again!`
                        }) 
                        // return next(error);
                      }
                      // let currentDate = new Date();
                      let currentDate = getJsDateFromExcel(item['Fiscal Year End Date']);
                      console.log("currentDate", currentDate);
                      if (cessaDate < currentDate) {
                        inactiveBoardMembersList.push(memberDetail)
                      }
                    }
                  }
                }
                // return {
                //   datapointId: datapointObject[0] ? datapointObject[0].id : null,
                //   companyId: companyObject[0] ? companyObject[0].id : null,
                //   year: item['Fiscal Year'],
                //   response: (item['Response'] == '0' || item['Response'] == 0 || item['Response']) ? item['Response'] : '',
                //   fiscalYearEndDate: item['Fiscal Year End Date'],
                //   status: true,
                //   createdBy: userDetail
                // }
              } catch (error) {
                  return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
                  // return next(error);
              }
            };

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

            for (let filterKmpIndex = 0; filterKmpIndex < filteredKmpMatrixDetails.length; filterKmpIndex++) {
              try {
                let item = filteredKmpMatrixDetails[filterKmpIndex];
                let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace(/[\s\r\n]/g, ''));
                let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
                let allKeyNamesList = Object.keys(item);
                const kmpMembersNameList = _.filter(allKeyNamesList, function (keyName) {
                  let trimmedKeyName = keyName.replace(/\s/g, "").replace(/[\s\r\n]/g, '').toLowerCase();
                  return trimmedKeyName != "category" && trimmedKeyName != "keyissues" && trimmedKeyName != "dpcode" &&
                    trimmedKeyName != "indicator" && trimmedKeyName != "description" && trimmedKeyName != "datatype" &&
                    trimmedKeyName != "unit" && trimmedKeyName != "fiscalyear" && trimmedKeyName != "fiscalyearenddate" &&
                    trimmedKeyName != "cin" && trimmedKeyName != "sourcename" && trimmedKeyName != "url" &&
                    trimmedKeyName != "pagenumber" && trimmedKeyName != "publicationdate" && trimmedKeyName != "textsnippet" && //TODO
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
                let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace(/[\r\n]/g, '').toLowerCase());
                let companyTaskObjectValue = companyTaskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id && obj.year == item['Fiscal Year']);
                if (item['Error Type'] != undefined && item['Error Type'] != "") {
                  let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
                  hasError = true;
                  let errorListObject = {
                    datapointId: datapointObject[0] ? datapointObject[0].id : null,
                    dpCode: item['DP Code'] ? item['DP Code'] : '',
                    year: item['Fiscal Year'],
                    companyId: companyObject[0] ? companyObject[0].id : null,
                    categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
                    taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
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
                for (let kmpIndex = 0; kmpIndex < kmpMembersNameList.length; kmpIndex++) {
                  let value = kmpMembersNameList[kmpIndex];
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
                    isRestated: item['isRestated'],
                    restatedForYear: item['restatedForYear'],
                    restatedInYear: item['restatedInYear'],
                    restatedValue: item['restatedValue'],
                    publicationDate: item['Publication date'],
                    textSnippet: item['Text snippet'],
                    screenShot: item['Screenshot (in png)'],
                    sourceFileType: 'pdf',
                    filePathway: item['File pathway'],
                    commentCalculations: item['Comments/Calculations'],
                    internalFileSource: item['Internal file source'],
                    collectionStatus: false,
                    verificationStatus: false,
                    hasCorrection: false,
                    comments: [],
                    hasError: false,
                    taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
                    status: true,
                    createdBy: userDetail
                  }
                  kmpMembersList.push(memberDetail);
                }
              } catch (error) {
                // return next(error);
                return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
              }
            }

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
                try {
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
                              sourceName: responseToUpdate[0].sourceName ? responseToUpdate[0].sourceName : '',
                              url: responseToUpdate[0].url ? responseToUpdate[0].url : '',
                              pageNumber: responseToUpdate[0].pageNumber ? responseToUpdate[0].pageNumber : '',
                              publicationDate: responseToUpdate[0].publicationDate ? responseToUpdate[0].publicationDate : '',
                              textSnippet: responseToUpdate[0].textSnippet ? responseToUpdate[0].textSnippet : '',
                              screenShot: responseToUpdate[0].screenShot ? responseToUpdate[0].screenShot : '',
                              taskId: responseToUpdate[0].taskId ? responseToUpdate[0].taskId : null,
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
                } catch (error) {
                  // return next(error);
                  return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
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
              },
              clientTaxonomyId: clientTaxonomyId,
              status: true
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
              let companySourceDetails = await CompanySources.find({
                "companyId": {
                  $in: insertedCompanyIds
                },
                "fiscalYear": {
                  $in: distinctYears
                },
                status: true
              }).populate('companyId');
              for (let prvRespIndex = 0; prvRespIndex < companySourceDetails.length; prvRespIndex++) {
                for (let stdListIndex = 0; stdListIndex < structuredStandaloneDetails.length; stdListIndex++) {
                  let stdDetail = structuredStandaloneDetails[stdListIndex];
                  let isDataExist = companySourceDetails.findIndex((ele) => ele.sourceUrl == stdDetail.url && stdDetail.companyId == ele.companyId.id && stdDetail.year == ele.fiscalYear);
                  if (isDataExist != -1) {
                    let previousYearData = companySourceDetails[isDataExist];
                    structuredStandaloneDetails[stdListIndex].url = previousYearData.sourceUrl;
                    structuredStandaloneDetails[stdListIndex].sourceName = stdDetail.sourceName ? stdDetail.sourceName : previousYearData.sourceName1;
                    structuredStandaloneDetails[stdListIndex].isCounted = true;
                    structuredStandaloneDetails[stdListIndex].isDownloaded = true;
                  } else {
                    if (stdDetail.url == '' || stdDetail.url == ' ' || stdDetail.url == null) {
                      structuredStandaloneDetails[stdListIndex].isCounted = true;
                      structuredStandaloneDetails[stdListIndex].isDownloaded = true;
                    } else {
                      structuredStandaloneDetails[stdListIndex].isCounted = false;
                      structuredStandaloneDetails[stdListIndex].isDownloaded = false;
                    }
                  }
                }
              }
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
              for (let prvRespIndex = 0; prvRespIndex < companySourceDetails.length; prvRespIndex++) {
                for (let boardMemListIndex = 0; boardMemListIndex < boardMembersList.length; boardMemListIndex++) {
                  let boardDetail = boardMembersList[boardMemListIndex];
                  let isDataExist = companySourceDetails.findIndex((ele) => ele.sourceUrl == boardDetail.url && boardDetail.companyId == ele.companyId.id && boardDetail.year == ele.fiscalYear);
                  if (isDataExist != -1) {
                    let previousYearData = companySourceDetails[isDataExist];
                    boardMembersList[boardMemListIndex].url = previousYearData.sourceUrl;
                    boardMembersList[boardMemListIndex].sourceName = boardDetail.sourceName ? boardDetail.sourceName : previousYearData.sourceName1;
                    boardMembersList[boardMemListIndex].isCounted = true;
                    boardMembersList[boardMemListIndex].isDownloaded = true;
                  } else {
                    if (boardDetail.url == '' || boardDetail.url == ' ' || boardDetail.url == null) {
                      boardMembersList[boardMemListIndex].isCounted = true;
                      boardMembersList[boardMemListIndex].isDownloaded = true;
                    } else {
                      boardMembersList[boardMemListIndex].isCounted = false;
                      boardMembersList[boardMemListIndex].isDownloaded = false;
                    }
                  }
                }
              }
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
              for (let prvRespIndex = 0; prvRespIndex < companySourceDetails.length; prvRespIndex++) {
                for (let kmpListIndex = 0; kmpListIndex < kmpMembersList.length; kmpListIndex++) {
                  let kmpDetail = kmpMembersList[kmpListIndex];
                  let isDataExist = companySourceDetails.findIndex((ele) => ele.sourceUrl == kmpDetail.url && kmpDetail.companyId == ele.companyId.id && kmpDetail.year == ele.fiscalYear);
                  if (isDataExist != -1) {
                    let previousYearData = companySourceDetails[isDataExist];
                    kmpMembersList[kmpListIndex].url = previousYearData.sourceUrl;
                    kmpMembersList[kmpListIndex].sourceName = kmpDetail.sourceName ? kmpDetail.sourceName : previousYearData.sourceName1;
                    kmpMembersList[kmpListIndex].isCounted = true;
                    kmpMembersList[kmpListIndex].isDownloaded = true;
                  } else {
                    if (kmpDetail.url == '' || kmpDetail.url == ' ' || kmpDetail.url == null) {
                      kmpMembersList[kmpListIndex].isCounted = true;
                      kmpMembersList[kmpListIndex].isDownloaded = true;
                    } else {
                      kmpMembersList[kmpListIndex].isCounted = false;
                      kmpMembersList[kmpListIndex].isDownloaded = false;
                    }
                  }
                }
              }
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
    if (taskDetailsObject.taskStatus == 'Pending') {
      let dpCodesDetails = body.currentData;
      let dpHistoricalDpDetails = body.historicalData;
      let currentYearValues = [...new Set(dpCodesDetails.map(obj => obj.fiscalYear))];
      let historicalDataYear = [...new Set(dpHistoricalDpDetails.map(obj => obj.fiscalYear))];
      let mergedYear = _.concat(currentYearValues, historicalDataYear);
      if (body.memberType == 'Standalone') {  
        let currentYearData = [];
        for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
          let item = dpCodesDetails[dpIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }        
          await StandaloneDatapoints.updateMany({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: {isActive: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          currentYearData.push({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            isActive: true,
            status: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user,
            updatedAt: Date.now()
          });          
        }
        let historyYearData = [];
        for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
          let item = dpHistoricalDpDetails[dpHistoryIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await StandaloneDatapoints.updateMany({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: {isActive: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          dpHistoricalDpDetails.push({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: item['taskId'],
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            isActive: true,
            status: true,
            createdBy: user,
            updatedAt: Date.now()
          });
        }
        let structuredStandaloneDetails = _.concat(currentYearData, historyYearData);  
        await StandaloneDatapoints.insertMany(structuredStandaloneDetails)
        .then((result,err) => {
          if (err) {
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          } else {
            res.status('200').json({
              message: "Data inserted Successfully"
            });
          }
        });     
      } else if (body.memberType == 'Board Matrix') {   
        let currentYearData = [];
        for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
          let item = dpCodesDetails[dpIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot details!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          } 
          await BoardMembersMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: {isActive: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          currentYearData.push({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: formattedScreenShots,  //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            isActive: true,
            status: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user,
            memberName: body.memberName,
            updatedAt: Date.now()
          });
        }
        let historyYearData = [];
        for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
          let item = dpHistoricalDpDetails[dpHistoryIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot details!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          } 
          await BoardMembersMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true, status: true },
            { $set: {isActive: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          historyYearData.push({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: item['taskId'],
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            isActive: true,
            status: true,
            createdBy: user,
            updatedAt: Date.now()
          })
        }
        let boardMemberDetails = _.concat(currentYearData, historyYearData);  
        await BoardMembersMatrixDataPoints.insertMany(boardMemberDetails)
        .then((result,err) => {
          if (err) {
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          } else {
            res.status('200').json({
              message: "Data inserted Successfully"
            });
          }
        });
      } else if (body.memberType == 'KMP Matrix') {     
        let currentYearData = [];
        for (let dpIndex = 0; dpIndex < dpCodesDetails.length; dpIndex++) {
          let item = dpCodesDetails[dpIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot details!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await KmpMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true,status: true },
            { $set: {isActive: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          currentYearData.push({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: formattedScreenShots,  //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            isActive: true,
            status: true,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user,
            memberName: body.memberName,
            updatedAt: Date.now()
          });
        }
        let historyYearData = [];
        for (let dpHistoryIndex = 0; dpHistoryIndex < dpHistoricalDpDetails.length; dpHistoryIndex++) {
          let item = dpHistoricalDpDetails[dpHistoryIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot details!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await KmpMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], isActive: true,status: true },
            { $set: {isActive: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the data!" }) });
          historyYearData.push({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: item['taskId'],
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            isActive: true,
            status: true,
            createdBy: user,
            updatedAt: Date.now()
          });
        }
        let kmpMemberDetails = _.concat(currentYearData, historyYearData);         
        await KmpMatrixDataPoints.insertMany(kmpMemberDetails)
        .then((result,err) => {
          if (err) {
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          } else {
            res.status('200').json({
              message: "Data inserted Successfully"
            });
          }
        });
      }
    } else if (taskDetailsObject.taskStatus == 'Correction Pending') {
      let dpCodesDetails = body.currentData;
      let dpHistoricalDpDetails = body.historicalData;
      let currentYearValues = [...new Set(dpCodesDetails.map(obj => obj.fiscalYear))];
      let historicalDataYear = [...new Set(dpHistoricalDpDetails.map(obj => obj.fiscalYear))];      
      let mergedYear = _.concat(currentYearValues, historicalDataYear);
      if (body.memberType == 'Standalone') {   
        for (let dpDetailsIndex = 0; dpDetailsIndex < dpCodesDetails.length; dpDetailsIndex++) {
          let item = dpCodesDetails[dpDetailsIndex]
          let hasCorrectionValue = true;
          if(item.isAccepted == true) {
                     
            await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], raisedBy: item.rejectedTo, status: true },
            { $set: { isErrorAccepted: true, isErrorRejected: false} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update the error details!" }) });
          } else{
            let comments = {            
            author: 'Analyst',
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.rejectComment
            }
            await ErrorDetails.updateOne({ taskId: body.taskId, datapointId: body.dpCodeId, year: item['fiscalYear'], raisedBy: item.rejectedTo, status: true },
            { $set: {rejectComment : comments, isErrorAccepted: false, isErrorRejected: true} })
            .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update error details!" }) });
          }
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }           
          await StandaloneDatapoints.updateMany({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
          { $set: {isActive: false} })
          .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to update data!" }) });
          await StandaloneDatapoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: formattedScreenShots,  //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            isActive: true,
            status: true,
            hasError: false,
            dpStatus: "Error",
            hasCorrection: hasCorrectionValue,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user,
            updatedAt: Date.now()
          }).catch(err =>{
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          })          
        }
        for (let historyDetails = 0; historyDetails < dpHistoricalDpDetails.length; historyDetails++) {
          let item = dpHistoricalDpDetails[historyDetails];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch((error) => { return res.status(400).json({ status: "400", message: "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await StandaloneDatapoints.updateMany({ companyId: body.companyId, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
            { $set: {isActive: false} })
            .catch(error => { return res.status(400).json({ message: error.message ? error.message : "Failed to update data!" }) });
          await StandaloneDatapoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: item['taskId'],
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            isActive: true,
            status: true,
            createdBy: user,
            updatedAt: Date.now()
          }).catch(err =>{
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          });
        }
        res.status('200').json({
          message: "Data inserted Successfully"
        });
      } else if (body.memberType == 'Board Matrix') {    
        for (let dpDetailsIndex = 0; dpDetailsIndex < dpCodesDetails.length; dpDetailsIndex++) {
          let item = dpCodesDetails[dpDetailsIndex];
          let hasCorrectionValue = true;
          if(item.isAccepted == true) {
         
            await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], raisedBy: item.rejectedTo, status: true },
            { $set: { isErrorAccepted: true, isErrorRejected: false} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update error details!" }) });
          } else{
            let comments = {            
            author: 'Analyst',
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.rejectComment
            }
            await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], raisedBy: item.rejectedTo, status: true },
            { $set: {rejectComment : comments, isErrorAccepted: false, isErrorRejected: true} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update error details!" }) });
          }
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await BoardMembersMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
            { $set: {isActive: false} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update data!" }) });
          await BoardMembersMatrixDataPoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: formattedScreenShots,  //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            isActive: true,
            hasError: false,
            hasCorrection: hasCorrectionValue,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user,            
            dpStatus: "Error",
            memberName: body.memberName,
            updatedAt: Date.now()
          }).catch(err =>{
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          });        
        } 
        for (let historyIndex = 0; historyIndex < dpHistoricalDpDetails.length; historyIndex++) {
          let item = dpHistoricalDpDetails[historyIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await BoardMembersMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive: true, status: true },
            { $set: {isActive: false} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update the data!" }) });
          await BoardMembersMatrixDataPoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: item['taskId'],
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            status: true,
            isActive: true,
            createdBy: user,
            updatedAt: Date.now()
          }).catch(err =>{
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          });
        }
      } else if (body.memberType == 'KMP Matrix') {    
        for (let dpDetailsIndex = 0; dpDetailsIndex < dpCodesDetails.length; dpDetailsIndex++) {
          let item = dpCodesDetails[dpDetailsIndex];
          let hasCorrectionValue = true;
          if(item.isAccepted == true) {
         
            await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], raisedBy: item.rejectedTo, status: true },
            { $set: { isErrorAccepted: true, isErrorRejected: false} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update error details!" }) });
          } else{
            let comments = {            
            author: 'Analyst',
            fiscalYear: item.fiscalYear,
            dateTime: Date.now(),
            content: item.rejectComment
            }
            await ErrorDetails.updateOne({ taskId: body.taskId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'], raisedBy: item.rejectedTo, status: true },
            { $set: {rejectComment : comments, isErrorAccepted: false, isErrorRejected: true} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update error details!" }) });
          }
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await KmpMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive:true, status: true },
            { $set: {isActive : false} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update the data!" }) });
          await KmpMatrixDataPoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            year: item['fiscalYear'],
            taskId: body.taskId,
            response: item['response'],
            screenShot: formattedScreenShots,  //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            status: true,
            isActive: true,
            hasError: false,
            hasCorrection: hasCorrectionValue,
            correctionStatus: 'Completed',
            additionalDetails: item['additionalDetails'],
            createdBy: user,
            dpStatus: "Error",
            memberName: body.memberName,
            updatedAt: Date.now()
          }).catch(err =>{
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          });        
        } 
        for (let historyIndex = 0; historyIndex < dpHistoricalDpDetails.length; historyIndex++) {
          let item = dpHistoricalDpDetails[historyIndex];
          let formattedScreenShots = [];
          if (item['screenShot'] && item['screenShot'].length > 0) {
            for (let screenshotIndex = 0; screenshotIndex < item['screenShot'].length; screenshotIndex++) {
              let screenshotItem = item['screenShot'][screenshotIndex];
              let screenShotFileType = screenshotItem.base64.split(';')[0].split('/')[1];
              let screenshotFileName = body.companyId + '_' + body.dpCodeId + '_' + item['fiscalYear'] + '_' + body.memberName + '_' + screenshotIndex + '.' + screenShotFileType;
              await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, screenshotFileName, screenshotItem.base64)
              .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to store the screenshot!" }) });
              formattedScreenShots.push(screenshotFileName);
            }
          }
          await KmpMatrixDataPoints.updateMany({ companyId: body.companyId, memberName: body.memberName, datapointId: body.dpCodeId, year: item['fiscalYear'],isActive:true, status: true },
            { $set: {isActive : false} })
            .catch(error => { return res.status(500).json({ message: error.message ? error.message : "Failed to update the data!" }) });
          await KmpMatrixDataPoints.create({
            datapointId: body.dpCodeId,
            companyId: body.companyId,
            taskId: item['taskId'],
            year: item['fiscalYear'],
            response: item['response'],
            screenShot: formattedScreenShots, //aws filename todo
            textSnippet: item['textSnippet'],
            pageNumber: item['pageNo'],
            uom: item.subDataType ? (item.subDataType.selectedUom ? item.subDataType.selectedUom['value'] : null) : null,
            placeValue: item.subDataType ? (item.subDataType.selectedPlaceValue ? item.subDataType.selectedPlaceValue['value'] : null) : null,
            optionalAnalystComment: item['optionalAnalystComment'],
            isRestated: item['isRestated'],
            restatedForYear: item['restatedForYear'],
            restatedInYear: item['restatedInYear'],
            restatedValue: item['restatedValue'],
            publicationDate: item.source['publicationDate'],
            url: item.source['url'],
            sourceName: item.source['sourceName'] + ";" + item.source['value'],
            additionalDetails: item['additionalDetails'],
            memberName: body.memberName,
            status: true,
            isActive: true,
            createdBy: user,
            updatedAt: Date.now()
          }).catch(err =>{
            res.status('500').json({
              message: err.message ? err.message : "Failed to save the data"
            });
          });
        } 
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
