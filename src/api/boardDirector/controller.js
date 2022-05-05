import {success, notFound} from '../../services/response/';
import {BoardDirector} from '.';
import _ from 'lodash'
import XLSX from 'xlsx';
import moment from 'moment'
import {MasterCompanies} from '../masterCompanies';

export const create = async ({bodymen: {body}}, res, next) => {
  let checkDirectorDin = await BoardDirector.find ({din: body.din});
  try {
    if (checkDirectorDin.length > 0) {
      return res.status (402).json ({
        message: 'DIN already exists',
      });
    } else {
      if (body.din != '') {
        await BoardDirector.create ({
          din: body.din,
          name: body.name,
          gender: body.gender,
          companies: body.companies,
        }).then (async boardDirector => {
          return res.status (200).json ({
            message: 'Board Director created successfully',
            status: '200',
            data: boardDirector.view (true),
          });
        });
      }
    }
  } catch (error) {
    return res.status (500).json ({
      message: error.message,
      status: 500,
    });
  }
};

export const index = ({querymen: {query, select, cursor}}, res, next) =>
  BoardDirector.count (query)
    .then (count =>
      BoardDirector.find (query, select, cursor).then (boardDirectors => {
        let directorObjects = [];
        if (boardDirectors.length > 0) {
          boardDirectors.forEach (obj => {
            directorObjects.push ({
              _id: obj._id,
              din: obj.din,
              name: obj.name,
              gender: obj.gender,
              companies: obj.companies,
              createdAt: obj.createdAt,
              updatedAt: obj.updatedAt,
            });
          });
        }
        return res.status (200).json ({
          message: 'Board Director Retrieved successfully',
          status: '200',
          count: count,
          data: directorObjects,
        });
      })
    )
    .catch (next);

export const show = ({params}, res, next) =>
  BoardDirector.findById (params.id)
    .then (notFound (res))
    .then (boardDirector => (boardDirector ? boardDirector.view () : null))
    .then (success (res))
    .catch (next);

export const update = async ({bodymen: {body}, params}, res, next) => {
  let checkDirectorDin = await BoardDirector.find ({din: body.din});
  if (checkDirectorDin.length > 0) {
    checkDirectorDin.forEach (obj => {
      if (obj._id == params.id) {
        BoardDirector.findById (params.id)
          .then (notFound (res))
          .then (
            boardDirector =>
              boardDirector ? Object.assign (boardDirector, body).save () : null
          )
          .then (boardDirector => {
            return res.status (200).json ({
              message: 'Board Director Updated successfully',
              status: '200',
              data: boardDirector.view (true),
            });
          })
          .then (success (res))
          .catch (next);
      } else if (obj._id != params.id) {
        return res.status (402).json ({
          message: 'DIN already exists',
        });
      }
    });
  } else {
    BoardDirector.findById (params.id)
      .then (notFound (res))
      .then (
        boardDirector =>
          boardDirector ? Object.assign (boardDirector, body).save () : null
      )
      .then (
        boardDirector => (boardDirector ? boardDirector.view (true) : null)
      )
      .then (success (res))
      .catch (next);
  }
};

export const destroy = ({params}, res, next) =>
  BoardDirector.findById (params.id)
    .then (notFound (res))
    .then (boardDirector => (boardDirector ? boardDirector.remove () : null))
    .then (success (res, 204))
    .catch (next);

export const retrieveFilteredDataDirector = ({querymen: {query, select, cursor}}, res, next) => {
  let searchValue = query.searchValue;
  const searchQuery = {
    $or: [
    { din: { $regex: new RegExp(searchValue, 'gi') } },
    { name: { $regex: new RegExp(searchValue, 'gi') } },
    { 'companies.label': { $regex: new RegExp(searchValue, 'gi') } }
    ],
    };
  BoardDirector.count(searchQuery)
  .then (count =>
  BoardDirector.find (searchQuery,select, cursor).then (boardDirectors => {
    let directorObjects = [];
    if (boardDirectors.length > 0) {
      boardDirectors.forEach (obj => {
        directorObjects.push ({
          _id: obj._id,
          din: obj.din,
          name: obj.name,
          gender: obj.gender,
          companies: obj.companies,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        });
      });
    }
    return res.status (200).json ({
      message: 'Board Director Retrieved successfully',
      status: '200',
      count: count,
      data: directorObjects,
    });
  })
)
};

export const uploadBoardDirector = async (req, res, next) => {
  const filePath = req.file.path;
  let directorsData = [];
  let directorInfo = [];
  var workbook = XLSX.readFile (filePath, {
    sheetStubs: false,
    defval: '',
  });

  var sheet_name_list = workbook.SheetNames;
  sheet_name_list.forEach (async function(currentSheetName) {
    var worksheet = workbook.Sheets[currentSheetName];
    var sheetAsJson = XLSX.utils.sheet_to_json (worksheet, {defval: ' '});
    if (sheetAsJson.length > 0) {
      for (let index1 = 0; index1 < sheetAsJson.length; index1++) {
        const rowObject = sheetAsJson[index1];
        let companyObject = {
          din: rowObject['DIN'],
          name: rowObject['Name'],
          gender: rowObject['Gender'],
          companies: rowObject['Companies'],
        }
        directorInfo.push(companyObject);
      }
      if (directorInfo.length > 0) {
        let directorHeaders = [ "DIN", "Name", "Gender", "Companies" ]
        if (directorHeaders && directorHeaders.length > 0 && Object.keys(directorInfo[0]).length > 0) {
          let inputFileHeaders = Object.keys(sheetAsJson[0]);
          let missingHeaders =  _.difference(directorHeaders, inputFileHeaders);
          if (missingHeaders.length > 0) {
            return res.status(400).json({ status: "400", message: missingHeaders.join() + " fields are required but missing in the uploaded file!" });
          } 
        }
        let message = {
          message: 'Board Director uploaded Failed...',
          status: '400'
        }
        for (let index = 0; index < directorInfo.length; index++) {
          let checkDirectorDin = await BoardDirector.find ({din: directorInfo[index].din});
          var companiesArr = directorInfo[index].companies.split (',');
          var companyData = [];
          if (companiesArr.length > 1) {
            for (var comIndex = 0; comIndex < companiesArr.length; comIndex++) {
              let fetchId = await MasterCompanies.find ({cin: companiesArr[comIndex]});
              if (fetchId.length != 0) {
              companyData.push ({label: companiesArr[comIndex], value: fetchId[0]._id.valueOf ()});
              }
            }
          } else if (companiesArr.length === 1) {
            let fetchId = await MasterCompanies.find ({cin: companiesArr[comIndex]});
            if (fetchId.length != 0) {
            companyData.push ({label: companiesArr[comIndex], value: fetchId[0]._id.valueOf ()});
            }
          }
          directorInfo[index].companies = companyData;
          const isEmpty = Object.keys (checkDirectorDin).length === 0;         
          if (isEmpty == true) {
            await BoardDirector.create (directorInfo[index]).then (result => {
            message = {
              message: "Board Director Uploaded Sucessfully..",
              status: 200
            }
            });
          }
        } return res.status(message?.status).json (message)
      }
    }
  }); 
};
