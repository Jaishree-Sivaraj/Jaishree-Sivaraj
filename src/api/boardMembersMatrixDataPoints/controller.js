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


// export const uploadBoardMembersData = async (req, res, next) => {
//   let companiesData = [];
//     const filePath = req.file.path;
//     var workbook = XLSX.readFile(filePath, {
//       sheetStubs: false,
//       defval: ''
//     });
//     var sheet_name_list = workbook.SheetNames;
//     sheet_name_list.forEach(function (currentSheetName) {
//       var worksheet = workbook.Sheets[currentSheetName];
//       try {
//         var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, {
//           defval: " "
//         });
//         companiesData.push(sheetAsJson);
//       } catch (error) {
//         return res.status(400).json({
//           message: error.message
//         })
//       }
//     });

//     try {
//         let allFilesObject = [];
//         if (req.file.path.length >= 0) {
//           if (req.file.path.length == 1) {
//             for (let index = 0; index < req.file.path.length; index++) {


//               const filePath = req.file.path;
//               var workbook = XLSX.readFile(filePath, {
//                 sheetStubs: false,
//                 defval: ''
//               });
//               var sheet_name_list = workbook.SheetNames;
//               sheet_name_list.forEach(function (currentSheetName) {
//                 var worksheet = workbook.Sheets[currentSheetName];
//               });



//               let parsedSheetObject = [];
//               if (currentSheetName != 'Sheet3' && currentSheetName != 'SFDR') {
//                 //getting the complete sheet
//                 var worksheet = workbook.Sheets[currentSheetName];
//                 var idx, allColumnNames = [];
//                 var rangeNum = worksheet['!ref'].split(':').map(function (val) {
//                   return alphaToNum(val.replace(/[0-9]/g, ''));
//                 })
//                 var start = rangeNum[0];
//                 var end = rangeNum[1] + 1;
//                 for (idx = start; idx < end; idx++) {
//                   allColumnNames.push(numToAlpha(idx));
//                 }
//                 let headerRowsNumber = [];
//                 if (currentSheetName.toLowerCase() == 'matrix-directors' || currentSheetName.toLowerCase() == 'matrix-kmp') {
//                   let headersIndexDetails = _.filter(worksheet, (object, index) => {
//                     if (object.v == "Category") {
//                       headerRowsNumber.push(parseInt(index.substring(1)));
//                       return index;
//                     }
//                   });
//                 }
//                 var headers = {};
//                 var headers1 = {}, headers2 = {};
//                 var data = [];
//                 if (currentSheetName.toLowerCase() == 'matrix-directors' || currentSheetName.toLowerCase() == 'matrix-kmp') {
//                   // for (const [cellIndex, [key, cellId]] of Object.entries(Object.entries(worksheet))) {
//                   // for (let cellId=0; cellId < worksheet.length; cellId++) {
//                   for (const cellId in worksheet) {
//                     let keys = Object.keys(worksheet);
//                     let nextIndex = keys.indexOf(cellId) + 1;
//                     let nextItemKey = keys[nextIndex];
//                     // let nextCellId = worksheet[Number(cellIndex)+1];
//                     let nextCellId = nextItemKey;
//                     if (cellId[0] === "!") continue;
//                     //parse out the column, row, and value
//                     // var col = cellId.substring(0, 1);  
//                     var colStringName = cellId.replace(/[0-9]/g, '');
//                     var col = colStringName;
//                     var nextColStringName = nextCellId.replace(/[0-9]/g, '');
//                     var nextCol = nextColStringName;
//                     // var row = parseInt(cellId.substring(1));  
//                     var row = parseInt(cellId.match(/(\d+)/));
//                     var value = worksheet[cellId].v;
//                     //store header names
//                     if (currentSheetName.toLowerCase() == 'matrix-directors') {
//                       if (row == 1) {
//                         if (value != "Error types and definitions") {
//                           if (isNaN(value)) {
//                             headers[col] = value.replace(/[\s\r\n]/g, ' ');
//                           }
//                         }
//                         // storing the header names
//                         continue;
//                       } else if (headerRowsNumber.includes(row) && row != 1 && row == 32) {
//                         if (isNaN(value)) {
//                           headers1[col] = value.replace(/[\s\r\n]/g, ' ');
//                         }
//                         // storing the header names
//                         continue;
//                       } else if (headerRowsNumber.includes(row) && row != 1 && row == 63) {
//                         if (isNaN(value)) {
//                           headers2[col] = value.replace(/[\s\r\n]/g, ' ');
//                         }
//                         // storing the header names
//                         continue;
//                       }
//                       //pushing board members values to headers, headers1 and headers2
//                       if (row > headerRowsNumber[1] && row != 1 && row > 32 && row < 63) {
//                         if (!data[row]) data[row] = {};
//                         if (col != 'A') {
//                           try {
//                             if (headers1['A']) {
//                               if (data[row][headers1['A']]) {
//                                 //take all column names in an array
//                                 let currentColumnIndex = allColumnNames.indexOf(col);
//                                 let previousColumnIndex = currentColumnIndex - 1;
//                                 let nextColumnIndex = currentColumnIndex + 1;
//                                 data[row][headers1[col]] = value;
//                                 if (!data[row][headers1[allColumnNames[previousColumnIndex]]] && data[row][headers1[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                                   data[row][headers1[allColumnNames[previousColumnIndex]]] = '';
//                                 }
//                                 if (!data[row][headers1[allColumnNames[nextColumnIndex]]]) {
//                                   data[row][headers1[allColumnNames[nextColumnIndex]]] = '';
//                                   let nextCellId = allColumnNames[nextColumnIndex] + row;
//                                   if (nextCellId) {
//                                     let expectedNextCol = allColumnNames[nextColumnIndex];
//                                     if (nextCol != expectedNextCol) {
//                                       let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
//                                       let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
//                                       let difference = indexOfActualNextCol - indexOfExpectedNextCol;
//                                       if (difference > 1) {
//                                         for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
//                                           data[row][headers1[allColumnNames[inx]]] = '';
//                                         }
//                                       } else {
//                                         for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
//                                           data[row][headers1[allColumnNames[inx]]] = '';
//                                         }
//                                       }
//                                     }
//                                   }
//                                 }
//                               }
//                             }
//                           } catch (error) {
//                             return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
//                           }
//                         } else {
//                           if (isNaN(value)) {
//                             data[row][headers1[col]] = value.replace(/[\s\r\n]/g, ' ');
//                           } else {
//                             data[row][headers1[col]] = value;
//                           }
//                         }
//                       } else if (row > headerRowsNumber[1] && row != 1 && row > 63) {
//                         if (!data[row]) data[row] = {};
//                         if (col != 'A') {
//                           try {
//                             if (headers2['A']) {
//                               if (data[row][headers2['A']]) {
//                                 //take all column names in an array
//                                 let currentColumnIndex = allColumnNames.indexOf(col);
//                                 let previousColumnIndex = currentColumnIndex - 1;
//                                 let nextColumnIndex = currentColumnIndex + 1;
//                                 data[row][headers2[col]] = value;
//                                 if (!data[row][headers2[allColumnNames[previousColumnIndex]]] && data[row][headers2[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                                   data[row][headers2[allColumnNames[previousColumnIndex]]] = '';
//                                 }
//                                 if (!data[row][headers2[allColumnNames[nextColumnIndex]]]) {
//                                   data[row][headers2[allColumnNames[nextColumnIndex]]] = '';
//                                   let nextCellId = allColumnNames[nextColumnIndex] + row;
//                                   if (nextCellId) {
//                                     let expectedNextCol = allColumnNames[nextColumnIndex];
//                                     if (nextCol != expectedNextCol) {
//                                       let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
//                                       let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
//                                       let difference = indexOfActualNextCol - indexOfExpectedNextCol;
//                                       if (difference > 1) {
//                                         for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
//                                           data[row][headers2[allColumnNames[inx]]] = '';
//                                         }
//                                       } else {
//                                         for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
//                                           data[row][headers2[allColumnNames[inx]]] = '';
//                                         }
//                                       }
//                                     }
//                                   }
//                                 }
//                               }
//                             }
//                           } catch (error) {
//                             return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
//                           }
//                         } else {
//                           if (isNaN(value)) {
//                             data[row][headers2[col]] = value.replace(/[\s\r\n]/g, ' ');
//                           } else {
//                             data[row][headers2[col]] = value;
//                           }
//                         }
//                       } else {
//                         if (!data[row]) {
//                           data[row] = {};
//                           data[row][headers[col]] = '';
//                         }

//                         if (col != 'A') {
//                           try {
//                             if (headers['A']) {
//                               if (data[row][headers['A']]) {
//                                 //take all column names in an array
//                                 let currentColumnIndex = allColumnNames.indexOf(col);
//                                 let previousColumnIndex = currentColumnIndex - 1;
//                                 let nextColumnIndex = currentColumnIndex + 1;
//                                 data[row][headers[col]] = value;
//                                 if (!data[row][headers[allColumnNames[previousColumnIndex]]] && data[row][headers[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                                   data[row][headers[allColumnNames[previousColumnIndex]]] = '';
//                                 }
//                                 if (!data[row][headers[allColumnNames[nextColumnIndex]]]) {
//                                   data[row][headers[allColumnNames[nextColumnIndex]]] = '';
//                                   let nextCellId = allColumnNames[nextColumnIndex] + row;
//                                   if (nextCellId) {
//                                     let expectedNextCol = allColumnNames[nextColumnIndex];
//                                     if (nextCol != expectedNextCol) {
//                                       let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
//                                       let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
//                                       let difference = indexOfActualNextCol - indexOfExpectedNextCol;
//                                       if (difference > 1) {
//                                         for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
//                                           data[row][headers[allColumnNames[inx]]] = '';
//                                         }
//                                       } else {
//                                         for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
//                                           data[row][headers[allColumnNames[inx]]] = '';
//                                         }
//                                       }
//                                     }
//                                   }
//                                   // if (!worksheet[nextCellId]) {
//                                   //   worksheet[nextCellId] = { t: "", v: "", w: "" };                          
//                                   // }
//                                 }
//                               }
//                             }
//                           } catch (error) {
//                             return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the headers" })
//                           }
//                         } else {
//                           if (isNaN(value)) {
//                             data[row][headers[col]] = value.replace(/[\s\r\n]/g, ' ');
//                           } else {
//                             data[row][headers[col]] = value;
//                           }
//                         }
//                       }
//                     } else {
//                       if (row == 1) {
//                         if (value != "Error types and definitions") {
//                           if (isNaN(value)) {
//                             headers[col] = value.replace(/[\s\r\n]/g, ' ');
//                           }
//                         }
//                         // storing the header names
//                         continue;
//                       } else if (headerRowsNumber.includes(row) && row != 1 && row == 12) {
//                         if (isNaN(value)) {
//                           headers1[col] = value.replace(/[\s\r\n]/g, ' ');
//                         }
//                         // storing the header names
//                         continue;
//                       } else if (headerRowsNumber.includes(row) && row != 1 && row == 23) {
//                         if (isNaN(value)) {
//                           headers2[col] = value.replace(/[\s\r\n]/g, ' ');
//                         }
//                         // storing the header names
//                         continue;
//                       }
//                       //pushing kmp members values to headers, headers1 and headers2
//                       if (row > headerRowsNumber[1] && row != 1 && row > 12 && row < 23) {
//                         if (!data[row]) data[row] = {};
//                         if (col != 'A') {
//                           try {
//                             if (headers1['A']) {
//                               if (data[row][headers1['A']]) {
//                                 //take all column names in an array
//                                 let currentColumnIndex = allColumnNames.indexOf(col);
//                                 let previousColumnIndex = currentColumnIndex - 1;
//                                 let nextColumnIndex = currentColumnIndex + 1;
//                                 data[row][headers1[col]] = value;
//                                 if (!data[row][headers1[allColumnNames[previousColumnIndex]]] && data[row][headers1[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                                   data[row][headers1[allColumnNames[previousColumnIndex]]] = '';
//                                 }
//                                 if (!data[row][headers1[allColumnNames[nextColumnIndex]]]) {
//                                   data[row][headers1[allColumnNames[nextColumnIndex]]] = '';
//                                   let nextCellId = allColumnNames[nextColumnIndex] + row;
//                                   if (nextCellId) {
//                                     let expectedNextCol = allColumnNames[nextColumnIndex];
//                                     if (nextCol != expectedNextCol) {
//                                       let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
//                                       let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
//                                       let difference = indexOfActualNextCol - indexOfExpectedNextCol;
//                                       if (difference > 1) {
//                                         for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
//                                           data[row][headers1[allColumnNames[inx]]] = '';
//                                         }
//                                       } else {
//                                         for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
//                                           data[row][headers1[allColumnNames[inx]]] = '';
//                                         }
//                                       }
//                                     }
//                                   }
//                                 }
//                               }
//                             }
//                           } catch (error) {
//                             return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
//                           }
//                         } else {
//                           if (isNaN(value)) {
//                             data[row][headers1[col]] = value.replace(/[\s\r\n]/g, ' ');
//                           } else {
//                             data[row][headers1[col]] = value;
//                           }
//                         }
//                       } else if (row > headerRowsNumber[1] && row != 1 && row > 23) {
//                         if (!data[row]) data[row] = {};
//                         if (col != 'A') {
//                           try {
//                             if (headers2['A']) {
//                               if (data[row][headers2['A']]) {
//                                 //take all column names in an array
//                                 let currentColumnIndex = allColumnNames.indexOf(col);
//                                 let previousColumnIndex = currentColumnIndex - 1;
//                                 let nextColumnIndex = currentColumnIndex + 1;
//                                 data[row][headers2[col]] = value;
//                                 if (!data[row][headers2[allColumnNames[previousColumnIndex]]] && data[row][headers2[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                                   data[row][headers2[allColumnNames[previousColumnIndex]]] = '';
//                                 }
//                                 if (!data[row][headers2[allColumnNames[nextColumnIndex]]]) {
//                                   data[row][headers2[allColumnNames[nextColumnIndex]]] = '';
//                                   let nextCellId = allColumnNames[nextColumnIndex] + row;
//                                   if (nextCellId) {
//                                     let expectedNextCol = allColumnNames[nextColumnIndex];
//                                     if (nextCol != expectedNextCol) {
//                                       let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
//                                       let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
//                                       let difference = indexOfActualNextCol - indexOfExpectedNextCol;
//                                       if (difference > 1) {
//                                         for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
//                                           data[row][headers2[allColumnNames[inx]]] = '';
//                                         }
//                                       } else {
//                                         for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
//                                           data[row][headers2[allColumnNames[inx]]] = '';
//                                         }
//                                       }
//                                     }
//                                   }
//                                 }
//                               }
//                             }
//                           } catch (error) {
//                             return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
//                           }
//                         } else {
//                           if (isNaN(value)) {
//                             data[row][headers2[col]] = value.replace(/[\s\r\n]/g, ' ');
//                           } else {
//                             data[row][headers2[col]] = value;
//                           }
//                         }
//                       } else {
//                         if (!data[row]) {
//                           data[row] = {};
//                           data[row][headers[col]] = '';
//                         }

//                         if (col != 'A') {
//                           try {
//                             if (headers['A']) {
//                               if (data[row][headers['A']]) {
//                                 //take all column names in an array
//                                 let currentColumnIndex = allColumnNames.indexOf(col);
//                                 let previousColumnIndex = currentColumnIndex - 1;
//                                 let nextColumnIndex = currentColumnIndex + 1;
//                                 data[row][headers[col]] = value;
//                                 if (!data[row][headers[allColumnNames[previousColumnIndex]]] && data[row][headers[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                                   data[row][headers[allColumnNames[previousColumnIndex]]] = '';
//                                 }
//                                 if (!data[row][headers[allColumnNames[nextColumnIndex]]]) {
//                                   data[row][headers[allColumnNames[nextColumnIndex]]] = '';
//                                   let nextCellId = allColumnNames[nextColumnIndex] + row;
//                                   if (nextCellId) {
//                                     let expectedNextCol = allColumnNames[nextColumnIndex];
//                                     if (nextCol != expectedNextCol) {
//                                       let indexOfActualNextCol = allColumnNames.indexOf(nextCol);
//                                       let indexOfExpectedNextCol = allColumnNames.indexOf(expectedNextCol);
//                                       let difference = indexOfActualNextCol - indexOfExpectedNextCol;
//                                       if (difference > 1) {
//                                         for (let inx = indexOfExpectedNextCol; inx < indexOfActualNextCol; inx++) {
//                                           data[row][headers[allColumnNames[inx]]] = '';
//                                         }
//                                       } else {
//                                         for (let inx = indexOfExpectedNextCol; inx < allColumnNames.length-1; inx++) {
//                                           data[row][headers[allColumnNames[inx]]] = '';
//                                         }
//                                       }
//                                     }
//                                   }
//                                   // if (!worksheet[nextCellId]) {
//                                   //   worksheet[nextCellId] = { t: "", v: "", w: "" };                          
//                                   // }
//                                 }
//                               }
//                             }
//                           } catch (error) {
//                             return res.status(500).json({ status: "500", message: error.message ? error.message : "Found data issues in the columns" })
//                           }
//                         } else {
//                           if (isNaN(value)) {
//                             data[row][headers[col]] = value.replace(/[\s\r\n]/g, ' ');
//                           } else {
//                             data[row][headers[col]] = value;
//                           }
//                         }
//                       }
//                     }
//                     // if(headerRowsNumber.includes(row) && row != 1){
//                   }
//                   //drop those first two rows which are empty
//                   data.shift();
//                   data.shift();
//                   parsedSheetObject.push(data);

//                 } else {
//                   for (const cellId in worksheet) {
//                     if (cellId[0] === "!") continue;
//                     var col = cellId.substring(0, 1);
//                     var row = parseInt(cellId.substring(1));
//                     var value = worksheet[cellId].v;
//                     if (row == 1) {
//                       headers[col] = value;
//                       continue;
//                     }

//                     if (!data[row] && value) data[row] = {};
//                     if (col != 'A') {
//                       if (headers['A']) {
//                         if (data[row][headers['A']]) {
//                           let currentColumnIndex = allColumnNames.indexOf(col);
//                           let previousColumnIndex = currentColumnIndex - 1;
//                           let nextColumnIndex = currentColumnIndex + 1;
//                           data[row][headers[col]] = value;
//                           if (!data[row][headers[allColumnNames[previousColumnIndex]]] && data[row][headers[allColumnNames[previousColumnIndex]]] != 0 && previousColumnIndex != 0) {
//                             data[row][headers[allColumnNames[previousColumnIndex]]] = '';
//                           }
//                           if (!data[row][headers[allColumnNames[nextColumnIndex]]]) {
//                             data[row][headers[allColumnNames[nextColumnIndex]]] = '';
//                           }
//                         }
//                       }
//                     } else {
//                       data[row][headers[col]] = value;
//                     }
//                   }
//                   data.shift();
//                   data.shift();
//                   parsedSheetObject.push(data);
//                 }
//               }
//               });
//               allFilesObject.push(parsedSheetObject)
//             }
  
//             //processing the extracted json from excel sheets start
  
//             let allCompanyInfos = [];
//             let allStandaloneDetails = [];
//             let allBoardMemberMatrixDetails = [];
//             let allKmpMatrixDetails = [];
//             //loop no of files uploaded
//             for (let allFilesArrayIndex = 0; allFilesArrayIndex < allFilesObject.length; allFilesArrayIndex++) {
//               //iterate each file
//               let noOfSheetsInAnFile = allFilesObject[allFilesArrayIndex].length;
  
//               //loop no of sheets in a file
//               let currentCompanyName = '';
//               for (let singleFileIndex = 0; singleFileIndex < noOfSheetsInAnFile; singleFileIndex++) {
//                 //iterate each sheet in a file
//                 let noOfRowsInASheet = allFilesObject[allFilesArrayIndex][singleFileIndex].length;
//                 for (let rowIndex = 0; rowIndex < noOfRowsInASheet; rowIndex++) {
//                   if (singleFileIndex == 0 && rowIndex == 0) {
//                     if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]) {
//                       allCompanyInfos.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]);
//                       currentCompanyName = allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['CIN'];
//                     }
//                   } else if (noOfSheetsInAnFile > 2) {
//                     if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex] && allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['DP Code']) {
//                       allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex].CIN = currentCompanyName;
//                       if (singleFileIndex == 2) {
//                         allBoardMemberMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
//                       } else if (singleFileIndex == 3) {
//                         allKmpMatrixDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
//                       } else if (singleFileIndex == 1) {
//                         allStandaloneDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
//                       }
//                     }
//                   } else {
//                     if (allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex] && allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex]['DP Code']) {
//                       allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex].CIN = currentCompanyName;
//                       allStandaloneDetails.push(allFilesObject[allFilesArrayIndex][singleFileIndex][rowIndex])
//                     }
//                   }
//                 }
//               }
//             }
//             let clientTaxonomyId = await ClientTaxonomy.findOne({
//               taxonomyName: "Acuite"
//             });
//             const companiesToBeAdded = _.uniqBy(allCompanyInfos, 'CIN');
//             for (let cinIndex = 0; cinIndex < companiesToBeAdded.length; cinIndex++) {
//               let taskObject = await TaskAssignment.find({
//                 status: true
//               }).populate('companyId')
//             }
//             if (missingFiles.length < 1) {
  
//               let categoriesObject = await Categories.find({
//                 clientTaxonomyId: "60c76f299def09f5ef0dca5c",
//                 status: true
//               });
//               let taskObject = await TaskAssignment.find({
//                 status: true
//               });
//               let companyTaskObject = await CompaniesTasks.find({
//                 status: true,
//               });
//               let errorTypeDetails = await Errors.find({
//                 status: true
//               });
//               const datapointList = await Datapoints.find({
//                 clientTaxonomyId: clientTaxonomyId,
//                 status: true,
//                 dpType: { $in: ["Board Matrix", "KMP Matrix"] }
//               });
//               const companiesList = await Companies.find({
//                 status: true
//               }).populate('createdBy');
//               let filteredBoardMemberMatrixDetails = _.filter(allBoardMemberMatrixDetails, (x) => {
//                 if (x) {
//                   if (Object.keys(x)[0] != undefined) {
//                     if (Object.keys(x)[0].toString() != Object.values(x)[0]) {
//                       return x;
//                     }
//                   }
//                 }
//               });
  
//               let filteredKmpMatrixDetails = _.filter(allKmpMatrixDetails, (x) => {
//                 if (x) {
//                   if (Object.keys(x)[0] != undefined) {
//                     if (Object.keys(x)[0].toString() != Object.values(x)[0]) {
//                       return x;
//                     }
//                   }
//                 }
//               });
//               let structuredStandaloneDetails = [];
//               // for (let strStdIindex = 0; strStdIindex < allStandaloneDetails.length; strStdIindex++) {
//               //   try {
//               //     const item = allStandaloneDetails[strStdIindex];
//               //     let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace(/[\r\n]/g, ''));
//               //     let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
//               //     let responseValue, hasError;
//               //     let categoriesObjectValues = categoriesObject.filter(obj => obj?.categoryName.toLowerCase() == item['Category'].replace(/[\r\n]/g, '').toLowerCase())
//               //     let companyTaskObjectValue = companyTaskObject.filter(obj => obj?.companyId == companyObject[0]?.id && obj?.categoryId == categoriesObjectValues[0]?.id && obj?.year == item['Fiscal Year']);
//               //     if (item['Error Type'] != undefined && item['Error Type'] != "") {
//               //       let errorTypeObject = errorTypeDetails.filter(obj => obj?.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
//               //       hasError = true;
//               //       // console.log("companyTaskObjectValue[0].taskId", companyTaskObjectValue[0].taskId);
//               //       let errorListObject = {
//               //         datapointId: datapointObject[0] ? datapointObject[0].id : null,
//               //         dpCode: item['DP Code'] ? item['DP Code'] : '',
//               //         year: item['Fiscal Year'],
//               //         companyId: companyObject[0] ? companyObject[0].id : null,
//               //         categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
//               //         taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
//               //         errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
//               //         raisedBy: "",
//               //         comments: [],
//               //         errorLoggedDate: Date.now(),
//               //         errorCaughtByRep: [],
//               //         errorStatus: true,
//               //         isErrorAccepted: false,
//               //         isErrorRejected: false,
//               //         rejectComment: "",
//               //         status: true,
//               //         createdBy: userDetail
//               //       }
//               //       errorDetails.push(errorListObject);
//               //     } else {
//               //       hasError = false
//               //     }
    
//               //     if (String(item['Response']).length > 0) {
//               //       if (item['Response'] == "" || item['Response'] == " " || item['Response'] == undefined) {
//               //         if (item['Response'] == "0" || item['Response'] == 0) {
//               //           responseValue = item['Response'];
//               //         } else {
//               //           responseValue = "NA";
//               //         }
//               //       } else {
//               //         responseValue = item['Response'];
//               //       }
//               //     } else {
//               //       responseValue = "NA";
//               //     }
//               //     let structuredStandaloneDetailsObject = {
//               //       categoryName: item['Category'],
//               //       keyIssueName: item['Key Issues'],
//               //       dpCode: item['DP Code'] ? item['DP Code'] : '',
//               //       datapointId: datapointObject[0] ? datapointObject[0].id : null,
//               //       year: item['Fiscal Year'],
//               //       fiscalYearEndDate: item['Fiscal Year End Date'],
//               //       response: responseValue,
//               //       companyId: companyObject[0] ? companyObject[0].id : null,
//               //       sourceName: item['Source name'],
//               //       url: item['URL'] ? item['URL'].toString() : '',
//               //       pageNumber: item['Page number'],
//               //       isRestated: item['isRestated'],
//               //       restatedForYear: item['restatedForYear'],
//               //       restatedInYear: item['restatedInYear'],
//               //       restatedValue: item['restatedValue'],
//               //       publicationDate: item['Publication date'],
//               //       textSnippet: item['Text snippet'],
//               //       screenShot: item['Screenshot (in png)'],
//               //       sourceFileType: 'pdf',
//               //       filePathway: item['File pathway'],
//               //       commentCalculations: item['Comments/Calculations'],
//               //       internalFileSource: item['Internal file source'],
//               //       comments: [],
//               //       collectionStatus: false,
//               //       verificationStatus: false,
//               //       hasError: false,
//               //       hasCorrection: false,
//               //       performanceResult: '',
//               //       standaloneStatus: '',
//               //       taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
//               //       submittedBy: '',
//               //       submittedDate: '',
//               //       standaradDeviation: '',
//               //       average: '',
//               //       activeStatus: '',
//               //       lastModifiedDate: '',
//               //       modifiedBy: '',
//               //       isSubmitted: false,
//               //       status: true,
//               //       createdBy: userDetail
//               //     }
//               //     structuredStandaloneDetails.push(structuredStandaloneDetailsObject);
//               //   } catch (error) {
//               //     return res.status(500).json({ status: "500", message: error.message ? error.message : "Invalid category name please check!" });
//               //   }
//               // }
                
//               // for (let stdIndex = 0; stdIndex < structuredStandaloneDetails.length; stdIndex++) {
//               //   let item = structuredStandaloneDetails[stdIndex];
//               //   let companyObject = companiesList.filter(obj => obj.id === item['companyId']);
//               //   let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['categoryName'].toLowerCase());
//               //   let companyTaskObjectValue = companyTaskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id && obj.year == item['year']);
//               //   if (companyTaskObjectValue.length > 0 && companyTaskObjectValue[0].taskId) {
//               //     await CompaniesTasks.updateOne({taskId: companyTaskObjectValue[0].taskId, year: item['year']}, { $set: { canGenerateJson: true, isJsonGenerated: false, isOverAllCompanyTaskStatus: true, completedDate: new Date() } })
//               //     .catch((error) => {
//               //       return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to update company task for standalone datapoints!" });
//               //     })
//               //   }
//               // }
//               // var insertedCompanies = _.filter(companiesList, (item) =>
//               //   _.some(structuredCompanyDetails, (obj) => item.cin === obj.cin));
  
//               // let insertedCompanyIds = [];
//               // _.forEach(insertedCompanies, (company) => {
//               //   insertedCompanyIds.push(company.id);
//               // });
  
//               // let distinctObjectByYears = _.uniqBy(structuredStandaloneDetails, 'year');
//               // let distinctNicObjects = _.uniqBy(structuredCompanyDetails, 'nic');
//               // let distinctNics = [];
//               // _.forEach(distinctNicObjects, (obj) => {
//               //   distinctNics.push(obj.nic);
//               // });
//               // let distinctYears = [];
//               // _.forEach(distinctObjectByYears, (obj) => {
//               //   distinctYears.push(obj.year);
//               // });
  
//               let distinctYears = [];
//               distinctYears.push(obj.year);
//               let boardMembersList = [];
//               let inactiveBoardMembersList = [];
//               let kmpMembersList = [];
//               for (let filterIndex = 0; filterIndex < filteredBoardMemberMatrixDetails.length; filterIndex++) {
//                 try {
//                   let item = filteredBoardMemberMatrixDetails[filterIndex];
//                   let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace(/[\s\r\n]/g, ''));
//                   let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
//                   let allKeyNamesList = Object.keys(item);
//                   const boardMembersNameList = _.filter(allKeyNamesList, function (keyName) {
//                     let trimmedKeyName = keyName.replace(/\s/g, "").replace(/[\s\r\n]/g, '').toLowerCase();
//                     return trimmedKeyName != "category" && trimmedKeyName != "keyissues" && trimmedKeyName != "dpcode" &&
//                       trimmedKeyName != "indicator" && trimmedKeyName != "description" && trimmedKeyName != "datatype" &&
//                       trimmedKeyName != "unit" && trimmedKeyName != "fiscalyear" && trimmedKeyName != "fiscalyearenddate" &&
//                       trimmedKeyName != "cin" && trimmedKeyName != "sourcename" && trimmedKeyName != "url" &&
//                       trimmedKeyName != "pagenumber" && trimmedKeyName != "publicationdate" && trimmedKeyName != "textsnippet" &&  //TODO
//                       trimmedKeyName != "screenshot(inpng)" && trimmedKeyName != "worddoc(.docx)" && trimmedKeyName != "excel(.xlsx)" &&
//                       trimmedKeyName != "excel(.xlxsx)" && trimmedKeyName != "pdf" && trimmedKeyName != "filepathway(ifany)" &&
//                       trimmedKeyName != "comments/calculations" && trimmedKeyName != "dataverification" &&
//                       trimmedKeyName != "errortype" && trimmedKeyName != "errorcomments" && trimmedKeyName != "internalfilesource" &&
//                       trimmedKeyName != "errorstatus" && trimmedKeyName != "analystcomments" && trimmedKeyName != "additionalcomments" &&
//                       trimmedKeyName != "errortypesanddefinitions" && trimmedKeyName != "errortypesanddefinations" && trimmedKeyName != "count" && trimmedKeyName != "20" &&
//                       trimmedKeyName != "t2.evidencenotsubstantive" && trimmedKeyName != "0" && trimmedKeyName != "7" &&
//                       trimmedKeyName != "goodtohave" && trimmedKeyName != "t2.others/noerror" && trimmedKeyName != "percentile" &&
//                       trimmedKeyName != "whenitisnotananalysterror/itisjustasuggestion" && trimmedKeyName != "undefined" && trimmedKeyName.length > 2;
//                   });
//                   let hasError;
//                   let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace(/[\r\n]/g, '').toLowerCase());
//                   let companyTaskObjectValue = companyTaskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id && obj.year == item['Fiscal Year']);
//                   if (item['Error Type'] != undefined && item['Error Type'] != "") {
//                     let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
//                     hasError = true;
//                     let errorListObject = {
//                       datapointId: datapointObject[0] ? datapointObject[0].id : null,
//                       dpCode: item['DP Code'] ? item['DP Code'] : '',
//                       year: item['Fiscal Year'],
//                       companyId: companyObject[0] ? companyObject[0].id : null,
//                       categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
//                       taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
//                       errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
//                       raisedBy: "",
//                       comments: [],
//                       errorLoggedDate: Date.now(),
//                       errorCaughtByRep: [],
//                       errorStatus: true,
//                       isErrorAccepted: false,
//                       isErrorRejected: false,
//                       rejectComment: "",
//                       status: true,
//                       createdBy: userDetail
//                     }
//                     errorDetails.push(errorListObject);
//                   } else {
//                     hasError = false
//                   }
//                   let promiseArr = [];
//                   for(let boardMemIndex = 0; boardMemIndex<boardMembersNameList.length; boardMemIndex++) {
//                     let value = boardMembersNameList[boardMemIndex];
//                     let memberDetail = {
//                       memberName: value,
//                       dpCode: item['DP Code'] ? item['DP Code'] : '',
//                       response: item[value],
//                       datapointId: datapointObject[0] ? datapointObject[0].id : null,
//                       companyId: companyObject[0] ? companyObject[0].id : null,
//                       year: item['Fiscal Year'],
//                       fiscalYearEndDate: item['Fiscal Year End Date'],
//                       sourceName: item['Source name'],
//                       url: item['URL'] ? item['URL'].toString() : '',
//                       pageNumber: item['Page number'],
//                       isRestated: item['isRestated'],
//                       restatedForYear: item['restatedForYear'],
//                       restatedInYear: item['restatedInYear'],
//                       restatedValue: item['restatedValue'],
//                       publicationDate: item['Publication date'],
//                       textSnippet: item['Text snippet'],
//                       screenShot: item['Screenshot (in png)'],
//                       sourceFileType: 'pdf',
//                       filePathway: item['File pathway'],
//                       commentCalculations: item['Comments/Calculations'],
//                       internalFileSource: item['Internal file source'],
//                       collectionStatus: false,
//                       verificationStatus: false,
//                       comments: [],
//                       hasError: false,
//                       hasCorrection: false,
//                       taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
//                       memberStatus: true,
//                       status: true,
//                       createdBy: userDetail
//                     };
//                     boardMembersList.push(memberDetail);
//                     if (item['DP Code'] == 'BOIR018') {
//                       if ((item[value].toString().toLowerCase() != 'n' || item[value].toString().toLowerCase() != 'no') && item[value].toString() != '' && item[value] != undefined && item[value] != null) {
    
//                         let cessaDate;
//                         try {
//                           cessaDate = getJsDateFromExcel(item[value]);
//                         } catch (error) {
//                           return res.status(500).json({
//                             status: "500",
//                             message: `Found invalid date format in ${companyObject[0] ? companyObject[0].companyName : 'a company'}, please correct and try again!`
//                           }) 
//                           // return next(error);
//                         }
//                         // let currentDate = new Date();
//                         let currentDate = getJsDateFromExcel(item['Fiscal Year End Date']);
//                         console.log("currentDate", currentDate);
//                         if (cessaDate < currentDate) {
//                           inactiveBoardMembersList.push(memberDetail)
//                         }
//                       }
//                     }
//                   }
//                   // return {
//                   //   datapointId: datapointObject[0] ? datapointObject[0].id : null,
//                   //   companyId: companyObject[0] ? companyObject[0].id : null,
//                   //   year: item['Fiscal Year'],
//                   //   response: (item['Response'] == '0' || item['Response'] == 0 || item['Response']) ? item['Response'] : '',
//                   //   fiscalYearEndDate: item['Fiscal Year End Date'],
//                   //   status: true,
//                   //   createdBy: userDetail
//                   // }
//                 } catch (error) {
//                     return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
//                     // return next(error);
//                 }
//               };
  
//               _.forEach(inactiveBoardMembersList, function (object) {
//                 let indexToUpdate = _.findIndex(boardMembersList, object);
//                 if (indexToUpdate >= 0) {
//                   boardMembersList[indexToUpdate].memberStatus = false;
//                 }
//                 let matchingMembers = boardMembersList.filter((obj) => {
//                   if (obj.memberName == object.memberName && obj.year == object.year && obj.companyId == object.companyId) {
//                     return obj;
//                   }
//                 });
//                 if (matchingMembers.length > 0) {
//                   for (let idx = 0; idx < matchingMembers.length; idx++) {
//                     let idxToUpdate = _.findIndex(boardMembersList, matchingMembers[idx]);
//                     if (indexToUpdate >= 0) {
//                       boardMembersList[idxToUpdate].memberStatus = false;
//                     }
//                   }
//                 }
//               });

//               //Needs to add the board members validation
  
//               for (let filterKmpIndex = 0; filterKmpIndex < filteredKmpMatrixDetails.length; filterKmpIndex++) {
//                 try {
//                   let item = filteredKmpMatrixDetails[filterKmpIndex];
//                   let companyObject = companiesList.filter(obj => obj.cin === item['CIN'].replace(/[\s\r\n]/g, ''));
//                   let datapointObject = datapointList.filter(obj => obj.code === item['DP Code']);
//                   let allKeyNamesList = Object.keys(item);
//                   const kmpMembersNameList = _.filter(allKeyNamesList, function (keyName) {
//                     let trimmedKeyName = keyName.replace(/\s/g, "").replace(/[\s\r\n]/g, '').toLowerCase();
//                     return trimmedKeyName != "category" && trimmedKeyName != "keyissues" && trimmedKeyName != "dpcode" &&
//                       trimmedKeyName != "indicator" && trimmedKeyName != "description" && trimmedKeyName != "datatype" &&
//                       trimmedKeyName != "unit" && trimmedKeyName != "fiscalyear" && trimmedKeyName != "fiscalyearenddate" &&
//                       trimmedKeyName != "cin" && trimmedKeyName != "sourcename" && trimmedKeyName != "url" &&
//                       trimmedKeyName != "pagenumber" && trimmedKeyName != "publicationdate" && trimmedKeyName != "textsnippet" && //TODO
//                       trimmedKeyName != "screenshot(inpng)" && trimmedKeyName != "worddoc(.docx)" && trimmedKeyName != "excel(.xlsx)" &&
//                       trimmedKeyName != "excel(.xlxsx)" && trimmedKeyName != "pdf" && trimmedKeyName != "filepathway(ifany)" &&
//                       trimmedKeyName != "comments/calculations" && trimmedKeyName != "dataverification" &&
//                       trimmedKeyName != "errortype" && trimmedKeyName != "errorcomments" && trimmedKeyName != "internalfilesource" &&
//                       trimmedKeyName != "errorstatus" && trimmedKeyName != "analystcomments" && trimmedKeyName != "additionalcomments" &&
//                       trimmedKeyName != "errortypesanddefinitions" && trimmedKeyName != "errortypesanddefinations" && trimmedKeyName != "count" && trimmedKeyName != "20" &&
//                       trimmedKeyName != "t2.evidencenotsubstantive" && trimmedKeyName != "0" && trimmedKeyName != "7" &&
//                       trimmedKeyName != "goodtohave" && trimmedKeyName != "t2.others/noerror" && trimmedKeyName != "percentile" &&
//                       trimmedKeyName != "whenitisnotananalysterror/itisjustasuggestion" && trimmedKeyName != "undefined" && trimmedKeyName.length > 2;
//                   });
//                   let hasError;
//                   let categoriesObjectValues = categoriesObject.filter(obj => obj.categoryName.toLowerCase() == item['Category'].replace(/[\r\n]/g, '').toLowerCase());
//                   let companyTaskObjectValue = companyTaskObject.filter(obj => obj.companyId == companyObject[0].id && obj.categoryId == categoriesObjectValues[0].id && obj.year == item['Fiscal Year']);
//                   if (item['Error Type'] != undefined && item['Error Type'] != "") {
//                     let errorTypeObject = errorTypeDetails.filter(obj => obj.errorType == item['Error Type'].replace(/[\s\r\n]/g, ''))
//                     hasError = true;
//                     let errorListObject = {
//                       datapointId: datapointObject[0] ? datapointObject[0].id : null,
//                       dpCode: item['DP Code'] ? item['DP Code'] : '',
//                       year: item['Fiscal Year'],
//                       companyId: companyObject[0] ? companyObject[0].id : null,
//                       categoryId: categoriesObjectValues ? categoriesObjectValues[0].id : null,
//                       taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
//                       errorTypeId: errorTypeObject[0] ? errorTypeObject[0].id : null,
//                       raisedBy: "",
//                       comments: [],
//                       errorLoggedDate: Date.now(),
//                       errorCaughtByRep: [],
//                       errorStatus: true,
//                       isErrorAccepted: false,
//                       isErrorRejected: false,
//                       rejectComment: "",
//                       status: true,
//                       createdBy: userDetail
//                     }
//                     errorDetails.push(errorListObject);
//                   } else {
//                     hasError = false
//                   }
//                   for (let kmpIndex = 0; kmpIndex < kmpMembersNameList.length; kmpIndex++) {
//                     let value = kmpMembersNameList[kmpIndex];
//                     let memberDetail = {
//                       memberName: value,
//                       response: item[value],
//                       dpCode: item['DP Code'] ? item['DP Code'] : '',
//                       memberStatus: true,
//                       datapointId: datapointObject[0] ? datapointObject[0].id : null,
//                       companyId: companyObject[0] ? companyObject[0].id : null,
//                       year: item['Fiscal Year'],
//                       fiscalYearEndDate: item['Fiscal Year End Date'],
//                       sourceName: item['Source name'],
//                       url: item['URL'] ? item['URL'].toString() : '',
//                       pageNumber: item['Page number'],
//                       isRestated: item['isRestated'],
//                       restatedForYear: item['restatedForYear'],
//                       restatedInYear: item['restatedInYear'],
//                       restatedValue: item['restatedValue'],
//                       publicationDate: item['Publication date'],
//                       textSnippet: item['Text snippet'],
//                       screenShot: item['Screenshot (in png)'],
//                       sourceFileType: 'pdf',
//                       filePathway: item['File pathway'],
//                       commentCalculations: item['Comments/Calculations'],
//                       internalFileSource: item['Internal file source'],
//                       collectionStatus: false,
//                       verificationStatus: false,
//                       hasCorrection: false,
//                       comments: [],
//                       hasError: false,
//                       taskId: companyTaskObjectValue[0] ? companyTaskObjectValue[0].taskId : null,
//                       status: true,
//                       createdBy: userDetail
//                     }
//                     kmpMembersList.push(memberDetail);
//                   }
//                 } catch (error) {
//                   // return next(error);
//                   return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
//                 }
//               }

//               // Needs to add the KMP member validation
  
//               let dpToFind = await Datapoints.findOne({
//                 code: "BOIP007"
//               });
//               let dpMapping = [{
//                 "BOCR013": "MACR023"
//               }, {
//                 "BOCR014": "MACR024"
//               }, {
//                 "BOCR015": "MACR025"
//               }, {
//                 "BOCR016": "MACR026"
//               }, {
//                 "BOCR018": "MACR029"
//               }, {
//                 "BODR005": "MASR008"
//               }, {
//                 "BOIR021": "MASR009"
//               }, {
//                 "BOSP003": "MASP002"
//               }, {
//                 "BOSP004": "MASP003"
//               }, {
//                 "BOSR009": "MASR007"
//               }];
//               let bmmDpsToFind = await Datapoints.find({
//                 code: {
//                   $in: ["BOCR013", "BOCR014", "BOCR015", "BOCR016", "BOCR018", "BODR005", "BOIR021", "BOSP003", "BOSP004", "BOSR009"]
//                 }
//               });
//               let kmpDpsToUpdate = await Datapoints.find({
//                 code: {
//                   $in: ["MACR023", "MACR024", "MACR025", "MACR026", "MACR029", "MASR008", "MASR009", "MASP002", "MASP003", "MASR007"]
//                 }
//               });
//               if (dpToFind) {
//                 for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
//                   try {
//                     const year = distinctYears[yearIndex];
//                     for (let companyIndex = 0; companyIndex < insertedCompanyIds.length; companyIndex++) {
//                       const companyId = insertedCompanyIds[companyIndex];
//                       let executiveMembersList = _.filter(boardMembersList, function (object) {
//                         if (object.datapointId == dpToFind.id && object.companyId == companyId && object.year == year && object.response == 'Yes') {
//                           return object;
//                         }
//                       });
//                       if (executiveMembersList.length > 0) {
//                         for (let executiveMemberIndex = 0; executiveMemberIndex < executiveMembersList.length; executiveMemberIndex++) {
//                           const executiveMemberObject = executiveMembersList[executiveMemberIndex];
    
//                           for (let findIndex = 0; findIndex < bmmDpsToFind.length; findIndex++) {
//                             const bmmDpObject = bmmDpsToFind[findIndex];
//                             let kmpDatapointCode = dpMapping.find((obj) => obj[bmmDpObject.code]);
//                             let matchingKmpObject = kmpDpsToUpdate.find((obj) => obj.code == kmpDatapointCode[bmmDpObject.code]);
//                             let responseToUpdate = _.filter(boardMembersList, function (obj) {
//                               return obj.datapointId == bmmDpObject.id &&
//                                 obj.companyId == companyId &&
//                                 obj.year == year &&
//                                 obj.memberName == executiveMemberObject.memberName;
//                             });
//                             if (responseToUpdate.length > 0) {
//                               let memberDetail = {
//                                 memberName: executiveMemberObject.memberName,
//                                 response: (responseToUpdate[0].response == '0' || responseToUpdate[0].response == 0 || responseToUpdate[0].response) ? responseToUpdate[0].response : '',
//                                 sourceName: responseToUpdate[0].sourceName ? responseToUpdate[0].sourceName : '',
//                                 url: responseToUpdate[0].url ? responseToUpdate[0].url : '',
//                                 pageNumber: responseToUpdate[0].pageNumber ? responseToUpdate[0].pageNumber : '',
//                                 publicationDate: responseToUpdate[0].publicationDate ? responseToUpdate[0].publicationDate : '',
//                                 textSnippet: responseToUpdate[0].textSnippet ? responseToUpdate[0].textSnippet : '',
//                                 screenShot: responseToUpdate[0].screenShot ? responseToUpdate[0].screenShot : '',
//                                 taskId: responseToUpdate[0].taskId ? responseToUpdate[0].taskId : null,
//                                 memberStatus: true,
//                                 datapointId: matchingKmpObject ? matchingKmpObject.id : null,
//                                 companyId: companyId,
//                                 year: year,
//                                 fiscalYearEndDate: executiveMemberObject.fiscalYearEndDate,
//                                 status: true,
//                                 createdBy: userDetail
//                               };
//                               kmpMembersList.push(memberDetail)
//                             }
//                           }
//                         }
//                       }
//                     }
//                   } catch (error) {
//                     // return next(error);
//                     return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to upload the input files" })
//                   }
//                 }
//               }
  
//               var actualDPList = _.concat(boardMembersList, kmpMembersList);
//               let missingDPList = [],
//                 expectedDPList = [],
//                 missingDatapointsDetails = [],
//                 missingDPsLength = [];
//               let standaloneDatapointsList = await Datapoints.find({
//                 dataCollection: "Yes",
//                 functionId: {
//                   "$ne": '609bcceb1d64cd01eeda092c'
//                 },
//                 clientTaxonomyId: clientTaxonomyId,
//                 status: true,
//                 dpType: { $in: ["Board Matrix", "KMP Matrix"] }
//               })
//               //actualDPlist, expectedDPlist(548) 
//               for (let expectedDPIndex = 0; expectedDPIndex < standaloneDatapointsList.length; expectedDPIndex++) {
//                 expectedDPList.push(standaloneDatapointsList[expectedDPIndex].code)
//               }
//               for (let companyIdIndex = 0; companyIdIndex < insertedCompanies.length; companyIdIndex++) {
//                 for (let year = 0; year < distinctYears.length; year++) {
//                   let missingDPs = _.filter(expectedDPList, (expectedCode) => !_.some(actualDPList, (obj) => expectedCode === obj.dpCode && obj.year == distinctYears[year] && obj.companyId == insertedCompanies[companyIdIndex]._id));
//                   if (missingDPs.length > 0 && distinctYears[year]) {
//                     let missingDPObject = {
//                       companyName: insertedCompanies[companyIdIndex].companyName,
//                       year: distinctYears[year],
//                       missingDPs: missingDPs
//                     }
//                     // missingDPsLength = _.concat(missingDPsLength,missingDPs);
//                     missingDatapointsDetails.push(missingDPObject);
//                   }
//                 }
//               }
//               missingDPList = _.concat(missingDPList, missingDatapointsDetails)
//               if (missingDPList.length == 0) {
//                 let companySourceDetails = await CompanySources.find({
//                   "companyId": {
//                     $in: insertedCompanyIds
//                   },
//                   "fiscalYear": {
//                     $in: distinctYears
//                   },
//                   status: true
//                 }).populate('companyId');
//                 for (let prvRespIndex = 0; prvRespIndex < companySourceDetails.length; prvRespIndex++) {
//                   for (let boardMemListIndex = 0; boardMemListIndex < boardMembersList.length; boardMemListIndex++) {
//                     let boardDetail = boardMembersList[boardMemListIndex];
//                     let isDataExist = companySourceDetails.findIndex((ele) => ele.sourceUrl == boardDetail.url && boardDetail.companyId == ele.companyId.id && boardDetail.year == ele.fiscalYear);
//                     if (isDataExist != -1) {
//                       let previousYearData = companySourceDetails[isDataExist];
//                       boardMembersList[boardMemListIndex].url = previousYearData.sourceUrl;
//                       boardMembersList[boardMemListIndex].sourceName = boardDetail.sourceName ? boardDetail.sourceName : previousYearData.sourceName1;
//                       boardMembersList[boardMemListIndex].isCounted = true;
//                       boardMembersList[boardMemListIndex].isDownloaded = true;
//                     } else {
//                       if (boardDetail.url == '' || boardDetail.url == ' ' || boardDetail.url == null) {
//                         boardMembersList[boardMemListIndex].isCounted = true;
//                         boardMembersList[boardMemListIndex].isDownloaded = true;
//                       } else {
//                         boardMembersList[boardMemListIndex].isCounted = false;
//                         boardMembersList[boardMemListIndex].isDownloaded = false;
//                       }
//                     }
//                   }
//                 }
//                 //Marking existing Data as False in BoardMemberMatrixDP 
//                 await BoardMembersMatrixDataPoints.updateMany({
//                   "companyId": {
//                     $in: insertedCompanyIds
//                   },
//                   "year": {
//                     $in: distinctYears
//                   }
//                 }, {
//                   $set: {
//                     status: false
//                   }
//                 }, {});
//                 await BoardMembersMatrixDataPoints.insertMany(boardMembersList)
//                   .then((err, result) => {
//                     if (err) {
//                       console.log('error', err);
//                     }
//                   });
//                 for (let prvRespIndex = 0; prvRespIndex < companySourceDetails.length; prvRespIndex++) {
//                   for (let kmpListIndex = 0; kmpListIndex < kmpMembersList.length; kmpListIndex++) {
//                     let kmpDetail = kmpMembersList[kmpListIndex];
//                     let isDataExist = companySourceDetails.findIndex((ele) => ele.sourceUrl == kmpDetail.url && kmpDetail.companyId == ele.companyId.id && kmpDetail.year == ele.fiscalYear);
//                     if (isDataExist != -1) {
//                       let previousYearData = companySourceDetails[isDataExist];
//                       kmpMembersList[kmpListIndex].url = previousYearData.sourceUrl;
//                       kmpMembersList[kmpListIndex].sourceName = kmpDetail.sourceName ? kmpDetail.sourceName : previousYearData.sourceName1;
//                       kmpMembersList[kmpListIndex].isCounted = true;
//                       kmpMembersList[kmpListIndex].isDownloaded = true;
//                     } else {
//                       if (kmpDetail.url == '' || kmpDetail.url == ' ' || kmpDetail.url == null) {
//                         kmpMembersList[kmpListIndex].isCounted = true;
//                         kmpMembersList[kmpListIndex].isDownloaded = true;
//                       } else {
//                         kmpMembersList[kmpListIndex].isCounted = false;
//                         kmpMembersList[kmpListIndex].isDownloaded = false;
//                       }
//                     }
//                   }
//                 }
//                 await KmpMatrixDataPoints.updateMany({
//                   "companyId": {
//                     $in: insertedCompanyIds
//                   },
//                   "year": {
//                     $in: distinctYears
//                   }
//                 }, {
//                   $set: {
//                     status: false
//                   }
//                 }, {});
//                 await KmpMatrixDataPoints.insertMany(kmpMembersList)
//                   .then((err, result) => {
//                     if (err) {
//                       console.log('error', err);
//                     }
//                   });
//                 await ErrorDetails.insertMany(errorDetails).then((err, result) => {
//                   if (err) {
//                     console.log('error', err);
//                   }
//                 });
//                 res.status(200).json({
//                   status: "200",
//                   message: "Files upload success",
//                   companies: insertedCompanies,
//                   nicList: distinctNics
//                 });
  
//               } else {
//                 return res.status(400).json({
//                   status: "400",
//                   message: "Missing DP Codes",
//                   missingDatapoints: missingDPList
//                 });
//               }
  
//             } else {
//               return res.status(400).json({
//                 status: "400",
//                 message: "Files Missing for below companies",
//                 missingFilesDetails: missingFiles
//               });
//             }
//           } else {
//             return res.status(400).json({
//               status: "400",
//               message: "Only one file is allowed to upload at a time, please upload the correct file"
//             });
  
//           }
//         } else {
//           return res.status(400).json({
//             status: "400",
//             message: "No files for attached!"
//           });
//         }
//       });
//     } catch (error) {
//       return res.status(403).json({
//         message: error.message ? error.message : 'Failed to upload controversy files',
//         status: 403
//       });
//     }
// }