import { success, notFound } from '../../services/response/';
import { BoardDirector } from '.';
import _ from 'lodash'
import XLSX from 'xlsx';
import moment from 'moment';
import { Companies } from '../companies';
import mongoose, { Schema } from 'mongoose';
import { getAggregationQueryToGetAllDirectors, getDirector, getUpdateObject, getUpdateObjectForDirector, checkIfRedundantDataHaveCessationDate, getQueryData, checkRedundantNameOrDIN, updateCompanyData } from './aggregation-query';

export const create = async ({ user }, body, res, next) => {
  var directorData = body.body;
  try {
    for (let index = 0; index < directorData.length; index++) {
      if (directorData[index].memberType == "Board Member" || directorData[index].memberType == "Board&KMP Matrix") {
        let checkDirectorDin = await BoardDirector.find({ $and: [{ BOSP004: directorData[index].name, companyId: mongoose.Types.ObjectId(directorData[index].companyId) }] });
        let checkdin = await BoardDirector.find({ din: directorData[index].din });
        if (checkdin.length > 0) {
          return res.status(402).json({
            message: 'DIN already exists for the same user',
            status: 402
          });
        } else if (checkDirectorDin.length > 0) {
          for(let directorIndex = 0; directorIndex < checkDirectorDin.length; directorIndex++){
            if(checkDirectorDin[directorIndex].cessationDate != ""){
              if (directorData[index].din != '' && directorData[index].companyId != '') {
                await BoardDirector.create({
                  din: directorData[index].din,
                  BOSP004: directorData[index].name,
                  BODR005: directorData[index].gender,
                  dob: directorData[index].dob,
                  companyId: directorData[index].companyId,
                  cin: directorData[index].cin,
                  companyName: directorData[index].companyName,
                  joiningDate: directorData[index].joiningDate,
                  cessationDate: directorData[index].cessationDate,
                  memberType: directorData[index].memberType,
                  createdBy: body.user
                })
              }
            }else{
              return res.status(402).json({
                message: 'Name and companyId already exists',
                status: 402
              });
            }
          }
          return res.status(200).json({
            message: 'Board Director created successfully',
            status: '200'
          });
        } 
      } else if (directorData[index].memberType == "KMP Matrix") {
        let checkDirectorDin = await BoardDirector.find({ $and: [{ name: directorData[index].name, companyId: mongoose.Types.ObjectId(directorData[index].companyId) }] });
        if (checkDirectorDin.length > 0) {
          return res.status(402).json({
            message: 'Name and companyId already exists',
            status: 402
          });
        } else {
          if (directorData[index].name != '' && directorData[index].companyId != '') {
            await BoardDirector.create({
              din: directorData[index].din,
              BOSP004: directorData[index].name,
              BODR005: directorData[index].gender,
              dob: directorData[index].dob,
              companyId: directorData[index].companyId,
              cin: directorData[index].cin,
              companyName: directorData[index].companyName,
              joiningDate: directorData[index].joiningDate,
              cessationDate: directorData[index].cessationDate,
              memberType: directorData[index].memberType,
              createdBy: body.user
            })
          }
        }
      }
    }
    return res.status(200).json({
      message: 'Board Director created successfully',
      status: '200'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  BoardDirector.count(query)
    .then(count =>
      BoardDirector.find(query, select, cursor).then(boardDirectors => {
        let directorObjects = [];
        // if (boardDirectors.length > 0) {
        //   boardDirectors.forEach (obj => {
        //     directorObjects.push ({
        //       _id: obj._id,
        //       din: obj.din,
        //       name: obj.name,
        //       gender: obj.gender,
        //       companies: obj.companies,
        //       createdAt: obj.createdAt,
        //       updatedAt: obj.updatedAt,
        //     });
        //   });
        // }
        return res.status(200).json({
          message: 'Board Director Retrieved successfully',
          status: '200',
          count: count,
          data: directorObjects,
        });
      })
    )
    .catch(next);

export const getAllBoardDirectors = async (req, res, next) => {
  try {
    const { page, limit, searchValue } = req.query;
    const { query, searchQuery } = getAggregationQueryToGetAllDirectors(page, limit, searchValue);
    const [allDirectors, totalDirectors] = await Promise.all([
      BoardDirector.aggregate(query),
      BoardDirector.distinct('din', { ...searchQuery, status: true })
    ]);

    return res.status(200).json({
      status: 200,
      message: 'Successfully retrieved Dierctors',
      allDirectors,
      count: totalDirectors?.length
    });

  } catch (error) {
    return res.status(409).json({
      status: 409,
      message: error?.message ? error?.message : 'Failed to retrieve all directors'
    })
  }
}

export const getDirectorByDINAndCompanyId = async (req, res, next) => {
  try {
    const { BOSP004 } = req.params;
    const [boardDirector] = await BoardDirector.aggregate(getDirector(BOSP004));
    if (!boardDirector) {
      return res.status(200).json({
        status: 200,
        message: `Name does not belong to any director`,
      });
    }

    return res.status(200).json({
      status: 200,
      message: `Successfully retrived Director's data`,
      data: boardDirector
    });

  } catch (error) {
    return res.status(409).json({
      status: 409,
      message: error?.message ? error?.message : `Failed to retrieve Director's data`
    })
  }
}

export const show = ({ params }, res, next) =>
  BoardDirector.findById(params.id)
    .then(notFound(res))
    .then(boardDirector => (boardDirector ? boardDirector.view() : null))
    .then(success(res))
    .catch(next);

export const update = async ({ bodymen: { body }, params }, res, next) => {
  let checkDirectorDin = await BoardDirector.find({ din: body.din });
  if (checkDirectorDin.length > 0) {
    checkDirectorDin.forEach(obj => {
      if (obj._id == params.id) {
        BoardDirector.findById(params.id)
          .then(notFound(res))
          .then(
            boardDirector =>
              boardDirector ? Object.assign(boardDirector, body).save() : null
          )
          .then(boardDirector => {
            return res.status(200).json({
              message: 'Board Director Updated successfully',
              status: '200',
              data: boardDirector.view(true),
            });
          })
          .catch(next);
      } else if (obj._id != params.id) {
        return res.status(402).json({
          message: 'DIN already exists',
        });
      }
    });
  } else {
    BoardDirector.findById(params.id)
      .then(notFound(res))
      .then(
        boardDirector =>
          boardDirector ? Object.assign(boardDirector, body).save() : null
      )
      .then(
        boardDirector => (boardDirector ? boardDirector.view(true) : null)
      )
      .catch(next);
  }
};

export const destroy = ({ params }, res, next) =>
  BoardDirector.findById(params.id)
    .then(notFound(res))
    .then(boardDirector => (boardDirector ? boardDirector.remove() : null))
    .then(success(res, 204))
    .catch(next);

export const retrieveFilteredDataDirector = ({ querymen: { query, select, cursor } }, res, next) => {
  let searchValue = query.searchValue;
  const searchQuery = {
    $or: [
      { din: { $regex: new RegExp(searchValue, 'gi') } },
      { name: { $regex: new RegExp(searchValue, 'gi') } },
      { 'companies.label': { $regex: new RegExp(searchValue, 'gi') } }
    ],
  };
  BoardDirector.count(searchQuery)
    .then(count =>
      BoardDirector.find(searchQuery, select, cursor).then(boardDirectors => {
        let directorObjects = [];
        if (boardDirectors.length > 0) {
          boardDirectors.forEach(obj => {
            directorObjects.push({
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
        return res.status(200).json({
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
  const user = req.user;
  let directorInfo = [];
  var workbook = XLSX.readFile(filePath, {
    sheetStubs: false,
    defval: '',
  });

  var sheet_name_list = workbook.SheetNames;
  sheet_name_list.forEach(async function (currentSheetName) {
    var worksheet = workbook.Sheets[currentSheetName];
    var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: ' ' });
    if (sheetAsJson.length > 0) {
      for (let index1 = 0; index1 < sheetAsJson.length; index1++) {
        const rowObject = sheetAsJson[index1];
        let companyObject = {
          din: rowObject['DIN'],
          BOSP004: rowObject['Name'],
          BODR005: rowObject['Gender'],
          dob: rowObject['DOB'],
          cin: rowObject['CIN'],
          joiningDate: rowObject['JoiningDate'],
          cessationDate: rowObject['cessationDate'],
          memberType: rowObject['memberType']
        }
        directorInfo.push(companyObject);
      }
      if (directorInfo.length > 0) {
        let directorHeaders = ["DIN", "Name", "Gender", "DOB", "CIN", "JoiningDate", "cessationDate", "memberType"]
        if (directorHeaders && directorHeaders.length > 0 && Object.keys(directorInfo[0]).length > 0) {
          let inputFileHeaders = Object.keys(sheetAsJson[0]);
          let missingHeaders = _.difference(directorHeaders, inputFileHeaders);
          if (missingHeaders.length > 0) {
            return res.status(400).json({ status: "400", message: missingHeaders.join() + " fields are required but missing in the uploaded file!" });
          }
        }
        let message = {
          message: 'Board Director uploaded Failed...',
          status: '400'
        }
        for (let index = 0; index < directorInfo.length; index++) {
          let fetchId = await Companies.find({ cin: directorInfo[index].cin });
          directorInfo[index].companyName = fetchId[0].companyName;
          directorInfo[index].companyId = fetchId[0]._id
          directorInfo[index].createdBy = user;
          let checkDirectorDin = await BoardDirector.find({ $and: [{ din: directorInfo[index].din, companyId: mongoose.Types.ObjectId(directorInfo[index].companyId) }] });
          const isEmpty = Object.keys(checkDirectorDin).length === 0;
          if (isEmpty == true) {
            await BoardDirector.create(directorInfo[index]).then(result => {
              message = {
                message: "Board Director Uploaded Sucessfully..",
                status: 200
              }
            });
          }
        } return res.status(message?.status).json(message)
      }
    }
  });
};

export const updateAndDeleteDirector = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { body, user } = req;
    const checkForRedundantCINWithNoCessationDate = checkIfRedundantDataHaveCessationDate(body);
    if (Object.keys(checkForRedundantCINWithNoCessationDate).length !== 0) {
      return res.status(409).json(checkForRedundantCINWithNoCessationDate)
    }
    for (let i = 0; i < body?.length; i++) {
      const updateObject = body[i];
      const { nameQueryForRedundantDIN, dinQueryForRedundantDIN, nameQueryForRedundantName, dinQueryForRedundantName } = await getQueryData(name, updateObject);
      const findQuery = { BOSP004: name, status: true, companyId: updateObject?.companyId };
      const checkRedundantData = await checkRedundantNameOrDIN(nameQueryForRedundantDIN, dinQueryForRedundantDIN, nameQueryForRedundantName, dinQueryForRedundantName);

      if (Object.keys(checkRedundantData).length !== 0) {
        return res.status(409).json(checkRedundantData)
      }
      const directorsDetailsWithCompany = await BoardDirector.find(findQuery);
      const data = getUpdateObject(updateObject, directorsDetailsWithCompany, user);
      let updateCompanyDetails = await updateCompanyData(updateObject, findQuery, data);
      // updating Directors details.
      let updateDirector;
      const directorsDetails = await BoardDirector.find({ BOSP004: name }).lean();
      for (let i = 0; i < directorsDetails?.length; i++) {
        const director = directorsDetails[i];
        const updateDirectorObject = getUpdateObjectForDirector(updateObject, director, user);
        updateDirector = await BoardDirector.findOneAndUpdate({ _id: director?._id, BOSP004: name }, {
          $set: updateDirectorObject
        }, { new: true });
      }
    }

    return res.status(200).json({
      status: 200,
      message: `Director's details updated successfully `
    })
  } catch (error) {
    console.log(error?.message);
    return res.status(409).json({
      status: 409,
      message: error?.message ? error?.message : `Failed to update director's details`
    })
  }
}
