import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ProjectedValues } from '.'
import {Companies} from '../companies'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import {DerivedDatapoints} from '../derived_datapoints'
import {Datapoints} from '../datapoints'
import { Functions } from '../functions'
import _ from 'lodash'

export const create = ({ user, bodymen: { body } }, res, next) =>
  ProjectedValues.create({ ...body, createdBy: user })
    .then((projectedValues) => projectedValues.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ProjectedValues.count(query)
    .then(count => ProjectedValues.find(query, select, cursor)
      .populate('createdBy')
      .populate('clientTaxonomyId')
      .populate('categoryId')
      .populate('datapointId')
      .then((projectedValues) => ({
        count,
        rows: projectedValues.map((projectedValues) => projectedValues.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  ProjectedValues.findById(params.id)
    .populate('createdBy')
    .populate('clientTaxonomyId')
    .populate('categoryId')
    .populate('datapointId')
    .then(notFound(res))
    .then((projectedValues) => projectedValues ? projectedValues.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  ProjectedValues.findById(params.id)
    .populate('createdBy')
    .populate('clientTaxonomyId')
    .populate('categoryId')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((projectedValues) => projectedValues ? Object.assign(projectedValues, body).save() : null)
    .then((projectedValues) => projectedValues ? projectedValues.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  ProjectedValues.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((projectedValues) => projectedValues ? projectedValues.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const getAverageByNic = async ({body},res,next)=> {
  let nicCompaniesList = [];
  nicCompaniesList = await Companies.find({ "clientTaxonomyId": body.clientTaxonomyId, "nic": body.nic, "status": true})
  let nicCompaniesIds = [];
  let datapointIds = [];
  for (let Index = 0; Index < nicCompaniesList.length; Index++) {
    nicCompaniesIds.push(nicCompaniesList[Index].id);
  }
  let percentileDatapoints = [], avgResponse = '0', stdDeviation = '0';
  let negativeNews = await Functions.findOne({"functionType" : "Negative News", "status": true});
  percentileDatapoints = await Datapoints.find({"clientTaxonomyId": body.clientTaxonomyId, "percentile": "Yes", "functionId": { $ne : negativeNews.id }, "status": true});
  if (percentileDatapoints.length <= 0) {
    return res.status(400).json({ status: "400", message: "There is no percentile datapoints for the selected fields!"})
  }
  for (let dIndex = 0; dIndex < percentileDatapoints.length; dIndex++) {
    datapointIds.push(percentileDatapoints[dIndex].id);
  }
  let responseData = [];
  let mergedDetails = [];
  let stdDetails = await StandaloneDatapoints.find({ 
  companyId: { $in: nicCompaniesIds }, 
  datapointId: { $in: datapointIds },
  isActive: true,
  year: body.year,
  status: true
  })
  .populate('companyId')
  .populate('datapointId');
  let bodDetails = await BoardMembersMatrixDataPoints.find({ 
  companyId: { $in: nicCompaniesIds }, 
  datapointId: { $in: datapointIds },
  year: body.year,
  isActive: true,
  status: true
  })
  .populate('companyId')
  .populate('datapointId');
  let kmpDetails = await KmpMatrixDataPoints.find({ 
  companyId: { $in: nicCompaniesIds }, 
  datapointId: { $in: datapointIds },
  year: body.year,
  status: true
  })
  .populate('companyId')
  .populate('datapointId');
  let derivedDetails = await DerivedDatapoints.find({ 
  companyId: { $in: nicCompaniesIds }, 
  datapointId: { $in: datapointIds },
  year: body.year,
  status: true
  })
  .populate('companyId')
  .populate('datapointId');
  mergedDetails = _.concat(stdDetails, bodDetails, kmpDetails, derivedDetails);
  if (mergedDetails.length > 0) {
    for (let index = 0; index < percentileDatapoints.length; index++) {
      let sumOfResponse = 0;
      let allResponses = [];
      var responseValue = 0;
      for (let cIndex = 0; cIndex < nicCompaniesIds.length; cIndex++) {
        let foundResponse = {};
        // allStandaloneDetails = await StandaloneDatapoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
        // responseValue = (allStandaloneDetails && Object.keys(allStandaloneDetails).length > 0) ? allStandaloneDetails.response : 
        foundResponse = mergedDetails.find(object => object['companyId']['id'] == nicCompaniesIds[cIndex] && object['datapointId']['id'] == datapointIds[index]);
        if (foundResponse && foundResponse.response) {
          responseValue = foundResponse.response; 
        }
        // allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
        // responseValue = (allBoardMemberMatrixDetails && Object.keys(allBoardMemberMatrixDetails).length > 0) ? allBoardMemberMatrixDetails.response : responseValue;
        // allKmpMatrixDetails = await KmpMatrixDataPoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
        // responseValue = (allKmpMatrixDetails && Object.keys(allKmpMatrixDetails).length > 0) ? allKmpMatrixDetails.response : responseValue;
        // allDerivedDetails = await DerivedDatapoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
        // responseValue = (allDerivedDetails && Object.keys(allDerivedDetails).length > 0) ? allDerivedDetails.response : responseValue;
        let currentCompanyResponse = responseValue;
        if (currentCompanyResponse == ' ' || currentCompanyResponse == '' || currentCompanyResponse == 'NA' ) {
            currentCompanyResponse = 0;        
        }
        sumOfResponse += Number(currentCompanyResponse);
        allResponses.push(Number(currentCompanyResponse));
      }
      let avgResponseValue = String(sumOfResponse/nicCompaniesIds.length); 
      // avgResponse = Math.round(avgResponseValue, 2).toFixed(2);
      let stdDeviationValue = Math.sqrt(allResponses.map(x => Math.pow(x - Number(avgResponseValue), 2)).reduce((a, b) => a + b) / (allResponses.length - 1));    
      // stdDeviation = Math.round(stdDeviationValue, 2).toFixed(2);
      let avgResponseObject = {
        clientTaxonomyId: body.clientTaxonomyId,
        datapointId: percentileDatapoints[index].id,
        nic: body.nic,
        year: body.year,
        categoryId: percentileDatapoints[index].categoryId,
        actualAverage: avgResponseValue,
        actualStdDeviation: stdDeviationValue
      }
      responseData.push(avgResponseObject);
    }
    if (responseData.length > 0) {
      for (let index = 0; index < responseData.length; index++) {
        await ProjectedValues.updateOne({ 
          clientTaxonomyId: responseData[index].clientTaxonomyId, 
          datapointId: responseData[index].datapointId, 
          year: responseData[index].year, 
          nic: body.nic }, 
          { 
            $set: responseData[index] 
          }, 
          { 
            upsert: true 
          })
          .catch((error) => {
            return res.status(500).json({
              status: "500",
              message: error.message ? error.message : "Failed to update actual value" 
            })
          });
      }
      return res.status(200).json({ status: "200", message: "response updated for datapoints", count: responseData.length, data: responseData})
    } else {
      return res.status(500).json({ status: "500", message: "There is no response values for percentile datapoints added yet!" })
    }    
  } else {
    return res.status(500).json({ status: "500", message: "There is no response values for percentile datapoints added yet!" })
  }
}

export const copyActualValuesAsProjected = async ({body}, res, next) => {
  await ProjectedValues.find({ 
    clientTaxonomyId: body.clientTaxonomyId ? body.clientTaxonomyId : null, 
    year: body.year ? body.year : '', 
    nic: body.nic ? body.nic : '' 
  })
  .populate('clientTaxonomyId')
  .populate('categoryId')
  .populate('datapointId')
  .then(async(projectedValues) => {
    if (projectedValues && projectedValues.length > 0) {
      for (let proIndex = 0; proIndex < projectedValues.length; proIndex++) {
        await ProjectedValues.updateOne({ _id: projectedValues[proIndex].id }, { 
          $set: { 
            projectedAverage: projectedValues[proIndex].actualAverage,
            projectedStdDeviation: projectedValues[proIndex].actualStdDeviation 
          } 
        })
        .catch((error) => { return res.status(500).json({ message: error.message ? error.message : 'Failed to update projected values!' }) });
      }
      return res.status(200).json({ status: "200", message: "Copied actual values to projected successfully!" });
    } else {
      return res.status(400).json({ status: "400", message: "There is no actuals available for the selected fields!" });
    }
  })
  .catch((error) => { 
    return res.status(500).json({ 
      status: "500", 
      message: error.message ? error.message : 'There is no actuals available for the selected fields!' 
    })
  });
}

export const getPercentileByPillar = async ({body}, res, next) => {
  try {
    let percentileDatapoints = await Datapoints.find({
      "clientTaxonomyId": body.taxonomy, 
      "categoryId": body.pillar, 
      "percentile": "Yes",
      "status": true
    }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'No percentile datapoints available!' }) });
    let years = body.years ? body.years : [];
    let completeDetails = [];
    if (percentileDatapoints.length > 0) {
      for (let index = 0; index < percentileDatapoints.length; index++) {
        let yearObj = {
          'dpCodeId': percentileDatapoints[index].id,
          'dpCode': percentileDatapoints[index].code,
          'fiveYearsBackAvg': '',
          'fourYearsBackAvg': '',
          'threeYearsBackAvg': '',
          'twoYearsBackAvg': '',
          'oneYearBackAvg': '',
           'projectedAvg': '',
          'fiveYearsBackSd': '',
          'fourYearsBackSd': '',
          'threeYearsBackSd': '',
          'twoYearsBackSd': '',
          'oneYearBackSd': '',
           'projectedSd': ''
        };
        let sdYearNumber = 'fiveYearsBackSd';
        let avgYearNumber = 'fiveYearsBackAvg';
        for (let yIndex = 0; yIndex < years.length; yIndex++) {
          if (yIndex == 1) {
            sdYearNumber = 'fourYearsBackSd';
            avgYearNumber = 'fourYearsBackAvg';
          } else if(yIndex == 2) {
            sdYearNumber = 'threeYearsBackSd';
            avgYearNumber = 'threeYearsBackAvg';
          } else if(yIndex == 3) {
            sdYearNumber = 'twoYearsBackSd';
            avgYearNumber = 'twoYearsBackAvg';
          } else if(yIndex == 4) {
            sdYearNumber = 'oneYearBackSd';
            avgYearNumber = 'oneYearBackAvg';
          }
          let dpResponse = await ProjectedValues.findOne({ 
            clientTaxonomyId: body.taxonomy, 
            datapointId: percentileDatapoints[index].id, 
            year: years[yIndex], 
            nic: body.nic 
          }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Datapoints value not found for the '+ years[yIndex] + ' year!' }) });
          if (dpResponse) {
            let actualAverageValue = Math.round( dpResponse.projectedAverage * 100 + Number.EPSILON ) / 100;
            let actualStdDeviationValue = Math.round( dpResponse.projectedStdDeviation * 100 + Number.EPSILON ) / 100;
            yearObj[avgYearNumber] = actualAverageValue;
            yearObj[sdYearNumber] = actualStdDeviationValue;
          } else {
            yearObj[avgYearNumber] = '';
            yearObj[sdYearNumber] = '';
          }
        }
        let currentYearValues = await ProjectedValues.findOne({ 
          clientTaxonomyId: body.taxonomy, 
          datapointId: percentileDatapoints[index].id,
          year: body.currentYear, 
          nic: body.nic
        }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Current year value not found for '+ percentileDatapoints[index].code + ' code!' }) })
        if (currentYearValues) {
          yearObj[ 'projectedAvg'] = Number(currentYearValues.projectedAverage).toFixed(2);
          yearObj[ 'projectedSd'] = Number(currentYearValues.projectedStdDeviation).toFixed(2);
        } else{
          yearObj[ 'projectedAvg'] = '';
          yearObj[ 'projectedSd'] = '';
        }
        completeDetails.push(yearObj);
      }
      res.status(200).json({ status: "200", message: "data retrieved sucessfully", response: completeDetails });
    } else {
      res.status(500).json({ status: "500", message: "No percentile datapoints available!" });
    }    
  } catch (error) {
    res.status(500).json({ status: "500", message: error.message ? error.message : "No percentile datapoints available!" });
  }
}

export const saveProjectedValue = async ({body}, res, next) => {  
  try {  
    let datapointData = body.data ? body.data : [];
    console.log("datapointData Length", datapointData.length);
    if (datapointData.length > 0) {
      for (let index = 0; index < datapointData.length; index++) {
        let objectToUpdate = { 
          clientTaxonomyId: body.taxonomy,
          datapointId: datapointData[index].dpCodeId,
          year: body.currentYear,
          categoryId: body.pillar,
          nic: body.nic,
          projectedAverage: datapointData[index].projectedAvg,
          projectedStdDeviation: datapointData[index].projectedSd,
          actualAverage : "",
          actualStdDeviation : ""
        }
        await ProjectedValues.updateOne({
          "clientTaxonomyId": body.taxonomy,
          "datapointId": datapointData[index].dpCodeId,
          "year": body.currentYear,
          "categoryId": body.pillar,
          "nic": body.nic
        },
        {
          $set: objectToUpdate
        },
        { upsert: true })
        .catch((error) => {
          return res.status(500).json({
            status: "500",
            message: error.message ? error.message : "Failed to update projected values"
          })
        });
      }
      res.status(200).json({ status: "200", message: "Projected values saved sucessfully" })
    } else {
      return res.status(500).json({ status: "500", message: "No data available!"})
    }
  } catch (error) {
    res.status(500).json({ status: "500", message: error.message ? error.message : "No data available!" }); 
  }
}
