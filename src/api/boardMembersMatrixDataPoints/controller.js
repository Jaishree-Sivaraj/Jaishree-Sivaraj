import XLSX from 'xlsx'
import fs from 'fs'
import _ from 'lodash'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { Companies } from '../companies'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { TaskAssignment } from '../taskAssignment'
import { Datapoints } from '../datapoints'
import { Categories } from '../categories'
import { ClientTaxonomy } from '../clientTaxonomy'
import { CompaniesTasks } from '../companies_tasks'
import { Errors } from '../error'
import { ErrorDetails } from '../errorDetails'
import { CompanySources } from '../companySources'
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { BoardMembersMatrixDataPoints } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  BoardMembersMatrixDataPoints.create({ ...body, createdBy: user })
    .then((boardMembersMatrixDataPoints) => boardMembersMatrixDataPoints.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  BoardMembersMatrixDataPoints.count(query)
    .then(count => BoardMembersMatrixDataPoints.find(query, select, cursor)
      .populate('createdBy')
      .populate('datapointId')
      .populate('companyId')
      .then((boardMembersMatrixDataPoints) => ({
        count,
        rows: boardMembersMatrixDataPoints.map((boardMembersMatrixDataPoints) => boardMembersMatrixDataPoints.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  BoardMembersMatrixDataPoints.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .populate('companyId')
    .then(notFound(res))
    .then((boardMembersMatrixDataPoints) => boardMembersMatrixDataPoints ? boardMembersMatrixDataPoints.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  BoardMembersMatrixDataPoints.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .populate('companyId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((boardMembersMatrixDataPoints) => boardMembersMatrixDataPoints ? Object.assign(boardMembersMatrixDataPoints, body).save() : null)
    .then((boardMembersMatrixDataPoints) => boardMembersMatrixDataPoints ? boardMembersMatrixDataPoints.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  BoardMembersMatrixDataPoints.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((boardMembersMatrixDataPoints) => boardMembersMatrixDataPoints ? boardMembersMatrixDataPoints.remove() : null)
    .then(success(res, 204))
    .catch(next)




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

export const uploadBoardMembersData = async (req, res, next) => {
  try {
    let allFilesObject = [];
    let userDetail = req.user;
    if (req.file.filename.length >= 0) {
      if (req.file.filename) {
        const filePath = req.file.path;
        var workbook = XLSX.readFile(filePath, {
          sheetStubs: false,
          defval: ''
        });
        var sheet_name_list = workbook.SheetNames;
        for (let index = 0; index < sheet_name_list.length; index++) {
          let currentSheetName = sheet_name_list[index];
          let parsedSheetObject = [];
          if (currentSheetName != 'Sheet3' && currentSheetName != 'SFDR') {
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
              for (const cellId in worksheet) {
                let keys = Object.keys(worksheet);
                let nextIndex = keys.indexOf(cellId) + 1;
                let nextItemKey = keys[nextIndex];
                let nextCellId = nextItemKey;
                if (cellId[0] === "!") continue;
                var colStringName = cellId.replace(/[0-9]/g, '');
                var col = colStringName;
                var nextColStringName = nextCellId.replace(/[0-9]/g, '');
                var nextCol = nextColStringName;
                var row = parseInt(cellId.match(/(\d+)/));
                var value = worksheet[cellId].v;
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
                    continue;
                  } else if (headerRowsNumber.includes(row) && row != 1 && row == 63) {
                    if (isNaN(value)) {
                      headers2[col] = value.replace(/[\s\r\n]/g, ' ');
                    }
                    continue;
                  }
                  if (row > headerRowsNumber[1] && row != 1 && row > 32 && row < 63) {
                    if (!data[row]) data[row] = {};
                    if (col != 'A') {
                      try {
                        if (headers1['A']) {
                          if (data[row][headers1['A']]) {
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
                                    for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length - 1; inx++) {
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
                                    for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length - 1; inx++) {
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
                                    for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length - 1; inx++) {
                                      data[row][headers[allColumnNames[inx]]] = '';
                                    }
                                  }
                                }
                              }
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
                                    for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length - 1; inx++) {
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
                                    for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length - 1; inx++) {
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
                                    for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length - 1; inx++) {
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
              }
              data.shift();
              data.shift();
              parsedSheetObject.push(data);

            } else {
              for (const cellId in worksheet) {
                if (cellId[0] === "!") continue;
                var col = cellId.substring(0, 1);
                var row = parseInt(cellId.substring(1));
                var value = worksheet[cellId].v;
                if (row == 1) {
                  headers[col] = value;
                  continue;
                }

                if (!data[row] && value) data[row] = {};
                if (col != 'A') {
                  if (headers['A']) {
                    if (data[row][headers['A']]) {
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
              data.shift();
              data.shift();
              parsedSheetObject.push(data);
            }
          }
          allFilesObject.push(parsedSheetObject)
        }
      }
      let allCompanyInfos = [];
      let distinctYears = taskObject.year.split(', ');
      let allBoardMemberMatrixDetails = [];
      let allKmpMatrixDetails = [];
      for (let allFilesArrayIndex = 0; allFilesArrayIndex < allFilesObject.length; allFilesArrayIndex++) {
        let noOfSheetsInAnFile = allFilesObject[allFilesArrayIndex].length;
        let currentCompanyName = '';
        for (let singleFileIndex = 0; singleFileIndex < noOfSheetsInAnFile; singleFileIndex++) {
          let noOfRowsInASheet = allFilesObject[allFilesArrayIndex][singleFileIndex].length;
          for (let rowIndex = 0; rowIndex < noOfRowsInASheet; rowIndex++) {
            if (singleFileIndex == 0 && rowIndex == 0 && noOfRowsInASheet == 1) {
              if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]) {
                allCompanyInfos.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]);
                currentCompanyName = allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['CIN'];
              }
            } else if(distinctYears.length == 2) {
              if (noOfRowsInASheet == 61) {
                allBoardMemberMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
              } else if (noOfRowsInASheet == 21) {
                allKmpMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
              }
            } else if(distinctYears.length == 3) {
              if (noOfRowsInASheet == 92) {
                allBoardMemberMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
              } else if (noOfRowsInASheet == 32) {
                allKmpMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
              }
            } else {
              if (noOfRowsInASheet == 30) {
                allBoardMemberMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
              } else if (noOfRowsInASheet == 10) {
                allKmpMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
              }
            }
          }
        }
      }
      let taskObject;
      // Add the vaidation whether the uploading company file and task Id are same or not
      const companiesToBeAdded = _.uniqBy(allCompanyInfos, 'CIN');
      const companiesList = await Companies.findOne({
        cin: companiesToBeAdded[0].CIN,
        status: true
      }).populate('createdBy');
      for (let cinIndex = 0; cinIndex < companiesToBeAdded.length; cinIndex++) {
        taskObject = await TaskAssignment.findOne({
          _id: req.body.taskId,
          status: true
        }).populate('companyId')
      }


      if (companiesList?.id != taskObject?.companyId?.id) {
        return res.status(400).json({status: "400", message: "Uploading file is not part of the current task, please check company info in file and try again!"})
      }
      let clientTaxonomyId = await ClientTaxonomy.findOne({
        taxonomyName: "Acuite"
      });
      let allBoardMembers = await BoardMembers.find({
        status: true
      }).populate('companyId')
      let allKmpMembers = await Kmp.find({
        status: true
      }).populate('companyId')
      let errorTypeDetails = await Errors.find({
        taskId: req.body.taskId,
        companyId: taskObject.companyId.id,
        status: true
      });
      const datapointList = await Datapoints.find({
        clientTaxonomyId: clientTaxonomyId,
        status: true,
        dpType: { $in: ["Board Matrix", "KMP Matrix"] }
      });
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
      let allYearsData = _.concat(filteredBoardMemberMatrixDetails,filteredKmpMatrixDetails )
      let excelData = _.uniqBy(allYearsData, function(e) {
        return e['Fiscal Year'];
      });
      let dataDsnctYears = excelData.map((obj) => {
        return obj['Fiscal Year']
      })
      let years = dataDsnctYears.filter( function(n) { return !this.has(n) }, new Set(distinctYears) );
      if (years.length > 0) {
        return res.status(400).json({status: "400", message: `Excel is having ${years} data which is not part of the current task year, please check! `})
      }

      let boardMembersList = [];
      let errorDetails = [];
      let inactiveBoardMembersList = [];
      let kmpMembersList = [];
      let boardMembersNameList = [];
      for (let filterIndex = 0; filterIndex < filteredBoardMemberMatrixDetails.length; filterIndex++) {
        try {
          let item = filteredBoardMemberMatrixDetails[filterIndex];
          let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
          let allKeyNamesList = Object.keys(item);
          boardMembersNameList = _.filter(allKeyNamesList, function (keyName) {
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
          if (item['Error Type'] != undefined && item['Error Type'] != "") {
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
            hasError = true;
            let errorListObject = {
              datapointId: datapointObject[0] ? datapointObject[0].id : null,
              dpCode: item['DP Code'] ? item['DP Code'] : '',
              year: item['Fiscal Year'],
              companyId: companiesList ? companiesList.id : null,
              categoryId: taskObject?.categoryId ? taskObject?.categoryId : null,
              taskId: taskObject?.id ? taskObject?.id : null,
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
          for (let boardMemIndex = 0; boardMemIndex < boardMembersNameList.length; boardMemIndex++) {
            let value = boardMembersNameList[boardMemIndex];
            let memberDetail = {
              memberName: value,
              dpCode: item['DP Code'] ? item['DP Code'] : '',
              response: item[value],
              datapointId: datapointObject[0] ? datapointObject[0].id : null,
              companyId: taskObject?.companyId ? taskObject?.companyId?.id : null,
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
              correctionStatus: "Completed",
              verificationStatus: false,
              comments: [],
              hasError: false,
              hasCorrection: false,
              taskId: taskObject?.id ? taskObject?.id : null,
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
                    message: `Found invalid date format in ${companiesList ? companiesList.companyName : 'a company'}, please correct and try again!`
                  })
                }
                let currentDate = getJsDateFromExcel(item['Fiscal Year End Date']);
                console.log("currentDate", currentDate);
                if (cessaDate < currentDate) {
                  inactiveBoardMembersList.push(memberDetail)
                }
              }
            }
          }
        } catch (error) {
          return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
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
      
      let invalidBodMemberList = [];
      let bodMembersToInsert = [];
      for (let index = 0; index < boardMembersNameList.length; index++) {
        const element = boardMembersNameList[index];
        let memberDetails = allBoardMembers.filter(obj => obj.BOSP004.toLowerCase().includes(element.toLowerCase()))
        if (memberDetails && memberDetails.length > 0) {
          let cmpMemberDetails = memberDetails.find(obj => obj.BOSP004.toLowerCase().includes(element.toLowerCase()) && obj.companyId.id == taskObject.companyId.id)
          if (!cmpMemberDetails) {
            let startDateData = boardMembersList.find(obj => obj.memberName == element && obj.dpCode == 'BOIR017')
            let endDateData = boardMembersList.find(obj => obj.memberName == element && obj.dpCode == 'BOIR018')
            let endDateTimeStampValue = endDateData?.response ? endDateData?.response : "";
            
            try {
              console.log();
              endDateData = endDateData?.response != '' ? getJsDateFromExcel(endDateData.response) : "";
              startDateData = getJsDateFromExcel(startDateData.response)
            } catch (error) {
              return res.status(400).json({status: "400", message: "Invalid date formats for BOIR017 and BOIR018 Dpcodes please check!"})
            }
            let memberObject = {
              BOSP004: element,
              companyId: taskObject.companyId.id,
              BODP001: memberDetails[0].BODP001,
              BODR005: memberDetails[0].BODR005,
              BOSP004: memberDetails[0].BOSP004,
              BOSP005: memberDetails[0].BOSP005,
              BOSP006: memberDetails[0].BOSP006,
              clientTaxonomyId: clientTaxonomyId.id,
              dob: '',
              endDate: endDateData ? endDateData : "",
              endDateTimeStamp: endDateTimeStampValue ? endDateTimeStampValue : 0,
              memberStatus: true,
              startDate: startDateData ? startDateData : "",
              createdBy: userDetail,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            bodMembersToInsert.push(memberObject);
          }
        } else {
          invalidBodMemberList.push(element);
        }
      }
      //Needs to add the board members validation
      await BoardMembers.insertMany(bodMembersToInsert)
      .then((res) => {})
      .catch((error) => {
        return res.status(500).json({status: "500", message: error?.message ? error?.message : "Failed to insert the board members"})
      })

      let kmpMembersNameList = [];

      for (let filterKmpIndex = 0; filterKmpIndex < filteredKmpMatrixDetails.length; filterKmpIndex++) {
        try {
          let item = filteredKmpMatrixDetails[filterKmpIndex];
          let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
          let allKeyNamesList = Object.keys(item);
          kmpMembersNameList = _.filter(allKeyNamesList, function (keyName) {
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
          if (item['Error Type'] != undefined && item['Error Type'] != "") {
            let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
            hasError = true;
            let errorListObject = {
              datapointId: datapointObject[0] ? datapointObject[0].id : null,
              dpCode: item['DP Code'] ? item['DP Code'] : '',
              year: item['Fiscal Year'],
              companyId: taskObject?.companyId ? taskObject?.companyId?.id : null,
              categoryId: taskObject?.categoryId ? taskObject?.categoryId : null,
              taskId: taskObject?.id ? taskObject?.id : null,
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
              companyId: taskObject?.companyId ? taskObject?.companyId?.id : null,
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
              correctionStatus: "Completed",
              hasCorrection: false,
              comments: [],
              hasError: false,
              taskId: taskObject?.id ? taskObject?.id : null,
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

      let invalidKmpMemberList = [];
      let kmpMembersToInsert = [];
      for (let index = 0; index < kmpMembersNameList.length; index++) {
        const element = kmpMembersNameList[index];
        let memberDetails = allKmpMembers.filter(obj => obj?.MASP003.toLowerCase().includes(element.toLowerCase()))
        if (memberDetails && memberDetails.length > 0) {
          let cmpMemberDetails = allKmpMembers.find(obj => obj?.MASP003.toLowerCase().includes(element.toLowerCase()) && obj.companyId.id == taskObject.companyId.id)
          if (!cmpMemberDetails) {
            let memberObject = {
              MASP003: element,
              companyId: taskObject?.companyId?.id ? taskObject?.companyId?.id : "",
              MASR008: memberDetails?.MAASR008 ? memberDetails?.MAASR008 : "",
              clientTaxonomyId: clientTaxonomyId.id,
              dob: '',
              endDate: "",
              endDateTimeStamp: 0,
              memberStatus: true,
              startDate: "",
              createdBy: userDetail
            }
            kmpMembersToInsert.push(memberObject);
          }
        } else {
          invalidKmpMemberList.push(element);
        }
        
      }
      // Needs to add the KMP member validation
      await Kmp.insertMany(kmpMembersToInsert)
      .then((res) => {})
      .catch((error) => {
        return res.status(500).json({status: "500", message: error?.message ? error?.message : "Failed to insert the kmp members"})
      })

      if(invalidKmpMemberList.length > 0 || invalidBodMemberList.length > 0){
        let responseObject = {
          BoardMembers: invalidBodMemberList.length > 0 ? invalidBodMemberList : [],
          KMPMembers: invalidKmpMemberList.length > 0 ? invalidKmpMemberList : []
        }
        return res.status(400).json({
          status: "400",
          message: "Invalid Members please check!",
          Data: responseObject
        })
      }

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

      const [dpToFind, bmmDpsToFind, kmpDpsToUpdate] = await Promise.all([
        Datapoints.findOne({
          code: "BOIP007"
        }),
        Datapoints.find({
          code: {
            $in: ["BOCR013", "BOCR014", "BOCR015", "BOCR016", "BOCR018", "BODR005", "BOIR021", "BOSP003", "BOSP004", "BOSR009"]
          }
        }),
        Datapoints.find({
          code: {
            $in: ["MACR023", "MACR024", "MACR025", "MACR026", "MACR029", "MASR008", "MASR009", "MASP002", "MASP003", "MASR007"]
          }
        })
      ])
      // let dpToFind = await Datapoints.findOne({
      //   code: "BOIP007"
      // });
      // let bmmDpsToFind = await Datapoints.find({
      //   code: {
      //     $in: ["BOCR013", "BOCR014", "BOCR015", "BOCR016", "BOCR018", "BODR005", "BOIR021", "BOSP003", "BOSP004", "BOSR009"]
      //   }
      // });
      // let kmpDpsToUpdate = await Datapoints.find({
      //   code: {
      //     $in: ["MACR023", "MACR024", "MACR025", "MACR026", "MACR029", "MASR008", "MASR009", "MASP002", "MASP003", "MASR007"]
      //   }
      // });
      let insertedCompanyIds = [];
      let insertedCompanies = [];
      insertedCompanyIds.push(taskObject.companyId.id);
      insertedCompanies.push(taskObject.companyId);
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
            return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
          }
        }
      }

      var actualDPList = _.concat(boardMembersList, kmpMembersList);
      let missingDPList = [],
        expectedDPList = [],
        missingDatapointsDetails = [];
      let standaloneDatapointsList = await Datapoints.find({
        dataCollection: "Yes",
        functionId: {
          "$ne": '609bcceb1d64cd01eeda092c'
        },
        clientTaxonomyId: clientTaxonomyId,
        status: true,
        dpType: { $in: ["Board Matrix", "KMP Matrix"] }
      })
      for (let expectedDPIndex = 0; expectedDPIndex < standaloneDatapointsList.length; expectedDPIndex++) {
        expectedDPList.push(standaloneDatapointsList[expectedDPIndex].code)
      }
      for (let companyIdIndex = 0; companyIdIndex < insertedCompanies.length; companyIdIndex++) {
        for (let year = 0; year < distinctYears.length; year++) {
          let missingDPs = _.filter(expectedDPList, (expectedCode) => !_.some(actualDPList, (obj) => expectedCode === obj.dpCode && obj.year == distinctYears[year] && obj.companyId == insertedCompanies[0]._id));
          if (missingDPs.length > 0 && distinctYears[year]) {
            let missingDPObject = {
              companyName: insertedCompanies[companyIdIndex].companyName,
              year: distinctYears[year],
              missingDPs: missingDPs
            }
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
            }
          });
        await ErrorDetails.insertMany(errorDetails).then((err, result) => {
          if (err) {
            console.log('error', err);
          }
        });
        res.status(200).json({
          status: "200",
          message: "Data upload successfully",
        });

      } else {
        return res.status(400).json({
          status: "400",
          message: "Missing DP Codes",
          missingDatapoints: missingDPList
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "Only one file is allowed to upload at a time, please upload the correct file"
      });

    }
  } catch (error) {
    return res.status(403).json({
      message: error.message ? error.message : 'Failed to upload controversy files',
      status: 403
    });
  }
}