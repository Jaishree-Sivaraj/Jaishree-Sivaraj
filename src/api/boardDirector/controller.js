import {success, notFound} from '../../services/response/';
import {BoardDirector} from '.';
import XLSX from 'xlsx';
import multer from 'multer';
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
  BoardDirector.count ({})
  .then (count =>
  BoardDirector.find ({},select, cursor).then (boardDirector => {
    let boardDirectors = boardDirector.filter (function (v, i) {
      if (
        v.name.toLowerCase ().indexOf (query.company.toLowerCase ()) >= 0 ||
        v.din.toLowerCase ().indexOf (query.company.toLowerCase ()) >= 0
      ) {
        return true;
      } else false;
    });
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
  var workbook = XLSX.readFile (filePath, {
    sheetStubs: false,
    defval: '',
  });

  var sheet_name_list = workbook.SheetNames;
  sheet_name_list.forEach (function async (currentSheetName) {
    var worksheet = workbook.Sheets[currentSheetName];
    var sheetAsJson = XLSX.utils.sheet_to_json (worksheet, {defval: ' '});
    directorsData.push (sheetAsJson);
  });
  var data = directorsData[0];
  for (var i = 0; i < data.length; i++) {
    let checkDirectorDin = await BoardDirector.find ({din: data[i].DIN});
    var nameArr = data[i].Companies.split (',');
    let fetchId;
    var companyData = [];
    if (nameArr.length > 1) {
      for (var j = 0; j < nameArr.length; j++) {
        fetchId = await MasterCompanies.find ({cin: nameArr[j]});
        companyData.push ({label: nameArr[j], value: fetchId[0]._id});
      }
    } else if (nameArr.length === 1) {
      fetchId = await MasterCompanies.find ({cin: data[i].Companies});
      companyData.push ({label: data[i].Companies, value: fetchId[0]._id});
    }
    const isEmpty = Object.keys (checkDirectorDin).length === 0;
    if (isEmpty == true) {
      var directorObjects = {
        din: data[i].DIN,
        name: data[i].Name,
        gender: data[i].Gender,
        companies: companyData,
        createdAt: new Date (),
        updatedAt: new Date (),
      };
      await BoardDirector.insertMany (directorObjects).then (result => {
        return res.status (200).json ({
          message: 'Board Director uploaded Successfully',
          status: '200'
        });
      });
    } else {
      return res.status (400).json ({
        message: 'Board Director uploaded Failed...',
        status: '400'
      });
    }
  }
};
