import { success, notFound } from '../../services/response/';
import { BoardDirector } from '.';
import _ from 'lodash'
import XLSX from 'xlsx';
import { Companies } from '../companies';
import mongoose, { Schema } from 'mongoose';
import { getAggregationQueryToGetAllDirectors, getDirector, getUpdateObject, updateDirectorData, checkIfRedundantDataHaveCessationDate, getQueryData, checkRedundantNameOrDIN, updateCompanyData } from './aggregation-query';
import { storeFileInS3, fetchFileFromS3 } from "../../services/utils/aws-s3"


export const create = async (req, res, next) => {
  var directorData = req?.body?.companyList;
  var details = req?.body?.details;
  try {
    let addObject = [], fileName;
    if (details?.profilePhoto && details?.profilePhoto?.length > 0) {
      let profilePhotoItem = details.profilePhoto;
      let profilePhotoFileType = profilePhotoItem.split(';')[0].split('/')[1];
      let profilePhotoFileName = directorData[0].name + new Date().getTime() + '.' + profilePhotoFileType;
      let storeProfile = await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, profilePhotoFileName, profilePhotoItem)
        .catch((error) => {
          return res.status(400).json({ status: "400", message: "Failed to upload the Profile" })
        });
      fileName = profilePhotoFileName;
    }
    for (let index = 0; index < directorData.length; index++) {
      let checkDirectorCompany = [], checkDirectorDIN = [];
      let checkDirectorName = await BoardDirector.find({ BOSP004: directorData[index].name });
      if (directorData[index]?.din != "") {
        checkDirectorDIN = await BoardDirector.find({ din: directorData[index].din });
      }
      if (directorData[index]?.companyId != "") {
        checkDirectorCompany = await BoardDirector.find({ $and: [{ BOSP004: directorData[index].name, companyId: mongoose.Types.ObjectId(directorData[index].companyId) }] });
      }
      if (checkDirectorName.length > 0) {
        return res.status(400).json({
          message: 'Name already exists',
          status: 400
        });
      } else if (checkDirectorDIN.length > 0) {
        return res.status(400).json({
          message: 'DIN already exists',
          status: 400
        });
      } else if (checkDirectorCompany > 0) {
        var checkingDuplicateValue = checkDirectorDin.some(function (e2) {
          return e2.cessationDate != "";
        });
        if (checkingDuplicateValue == true) {
          var data = {
            din: directorData[index]?.din,
            BOSP004: directorData[index]?.name.trim(),
            BODR005: directorData[index]?.gender,
            dob: directorData[index]?.dob,
            companyId: directorData[index]?.companyId,
            cin: directorData[index]?.cin,
            companyName: directorData[index]?.companyName,
            joiningDate: directorData[index]?.joiningDate,
            cessationDate: directorData[index]?.cessationDate,
            memberType: directorData[index]?.memberType,
            memberLevel: details?.memberLevel,
            qualification: details?.qualification,
            profilePhoto: fileName,
            socialLinks: details?.socialLinks,
            createdBy: req?.user,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          addObject.push(data)
        } else if (checkingDuplicateValue == false) {
          return res.status(400).json({
            message: 'Name or CompanyId already exists',
            status: 400
          });
        }
      }
      else {
        var data = {
          din: directorData[index]?.din,
          BOSP004: directorData[index]?.name.trim(),
          BODR005: directorData[index]?.gender,
          dob: directorData[index]?.dob,
          companyId: directorData[index]?.companyId,
          cin: directorData[index]?.cin,
          companyName: directorData[index]?.companyName,
          joiningDate: directorData[index]?.joiningDate,
          cessationDate: directorData[index]?.cessationDate,
          memberType: directorData[index]?.memberType,
          memberLevel: details?.memberLevel,
          qualification: details?.qualification,
          profilePhoto: fileName,
          socialLinks: details?.socialLinks,
          createdBy: req?.user,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        var checkingDuplicate = addObject.some(function (el) {
          return el?.cin === directorData[index]?.cin;
        });
        if (checkingDuplicate == false) {
          addObject.push(data)
        } else if (checkingDuplicate == true) {
          var checkingDuplicateValue = addObject.some(function (e2) {
            return e2?.cessationDate != "";
          });
          if (checkingDuplicateValue == true) {
            addObject.push(data)
          } else if (checkingDuplicateValue == false) {
            return res.status(400).json({
              message: 'CompanyId already exists',
              status: 400
            });
          }
        }
      }
    }
    let boardData = await BoardDirector.insertMany(addObject);
    if (boardData?.length == 0) {
      return res.status(400).json({
        message: 'Board Directors creation failed.',
        status: 400
      });
    } return res.status(200).json({
      message: 'Board Directors Created Successfully.. ',
      status: 200
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
      // Changed to name as Name is unique.
      BoardDirector.distinct('name', { ...searchQuery, status: true })
    ]);

    for (let i = 0; i < allDirectors?.length; i++) {
      if (allDirectors[i]?.profilePhoto && allDirectors[i]?.profilePhoto !== '') {
        const profile = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, allDirectors[i]?.profilePhoto);
        allDirectors[i].profilePhoto = profile;
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully retrieved Directors',
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
    if (boardDirector?.profilePhoto && boardDirector?.profilePhoto !== '') {
      const profile = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, boardDirector?.profilePhoto);
      boardDirector.profilePhoto = profile;
    }
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
    console.log(error?.message);
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
    const { companyList, details } = body;

    // This is handled in F.E. Logic needs to be changed incase somethings are there
    // const checkForRedundantCINWithNoCessationDate = checkIfRedundantDataHaveCessationDate(companyList);
    // if (Object.keys(checkForRedundantCINWithNoCessationDate).length !== 0) {
    //   return res.status(409).json(checkForRedundantCINWithNoCessationDate)
    // }

    let updateDirector;
    for (let i = 0; i < companyList?.length; i++) {
      const updateObject = companyList[i];
      const { dinConditionToCheckRedundantDIN, nameConditionToCheckRedundantName, nullValidationForDIN } = await getQueryData(name, updateObject);
      const findQuery = { BOSP004: name, status: true, companyId: updateObject?.companyId };
      const checkRedundantData = await checkRedundantNameOrDIN(name, dinConditionToCheckRedundantDIN, nameConditionToCheckRedundantName, nullValidationForDIN);

      if (Object.keys(checkRedundantData).length !== 0) {
        return res.status(409).json(checkRedundantData)
      }

      const directorsDetailsWithCompany = await BoardDirector.find(findQuery);
      const data = getUpdateObject(updateObject, directorsDetailsWithCompany, user);
      await updateCompanyData(updateObject, findQuery, data);
      // updating Directors details.
      updateDirector = await updateDirectorData(name, details, user, updateObject)

    }

    if (!updateDirector) {
      return res.status(409).json({
        status: 409,
        message: `Failed to update director's details`
      })
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
