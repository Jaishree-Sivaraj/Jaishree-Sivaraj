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
  for (let Index = 0; Index < nicCompaniesList.length; Index++) {
    nicCompaniesIds.push(nicCompaniesList[Index].id);
  }
  let percentileDatapoints = [], avgResponse = '0', stdDeviation = '0';
  let negativeNews = await Functions.find({"functionType" : "Negative News", "status": true})
  percentileDatapoints = await Datapoints.find({"clientTaxonomyId": body.clientTaxonomyId, "percentile": "Yes", "relevantForIndia" : "Yes", "functionId": { $ne : negativeNews.id }, "status": true});
  let responseData = [];
  for (let index = 0; index < percentileDatapoints.length; index++) {
    let sumOfResponse = 0;
    let allResponses = [];
    // let mergedDetails;
    let allStandaloneDetails, allKmpMatrixDetails, allBoardMemberMatrixDetails, allDerivedDetails;
    var responseValue = 0;
    for (let cIndex = 0; cIndex < nicCompaniesIds.length; cIndex++) {
      allStandaloneDetails = await StandaloneDatapoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
      responseValue = (allStandaloneDetails && Object.keys(allStandaloneDetails).length > 0) ? allStandaloneDetails.response : responseValue;
      allBoardMemberMatrixDetails = await BoardMembersMatrixDataPoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
      responseValue = (allBoardMemberMatrixDetails && Object.keys(allBoardMemberMatrixDetails).length > 0) ? allBoardMemberMatrixDetails.response : responseValue;
      allKmpMatrixDetails = await KmpMatrixDataPoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
      responseValue = (allKmpMatrixDetails && Object.keys(allKmpMatrixDetails).length > 0) ? allKmpMatrixDetails.response : responseValue;
      allDerivedDetails = await DerivedDatapoints.findOne({ 'companyId': nicCompaniesIds[cIndex], 'datapointId': percentileDatapoints[index].id, 'year': body.year, 'status': true })
      responseValue = (allDerivedDetails && Object.keys(allDerivedDetails).length > 0) ? allDerivedDetails.response : responseValue;
      let currentCompanyResponse = responseValue;
      if (currentCompanyResponse == ' ' || currentCompanyResponse == '' || currentCompanyResponse == 'NA' ) {
          currentCompanyResponse = 0;        
      }
      sumOfResponse += Number(currentCompanyResponse);
      allResponses.push(Number(currentCompanyResponse));
    }
    avgResponse = String(sumOfResponse/nicCompaniesIds.length);
    stdDeviation = Math.sqrt(allResponses.map(x => Math.pow(x - Number(avgResponse), 2)).reduce((a, b) => a + b) / (allResponses.length - 1));    
    let avgResponseObject = {
      clientTaxonomyId: body.clientTaxonomyId,
      datapointId: percentileDatapoints[index].id,
      nic: body.nic,
      year: body.year,
      categoryId: percentileDatapoints[index].categoryId,
      actualAverage: avgResponse,
      actualStdDeviation: stdDeviation
    }
    responseData.push(avgResponseObject);
  }
  if (responseData.length > 0) {
    for (let index = 0; index < responseData.length; index++) {
      await ProjectedValues.updateOne({ clientTaxonomyId: responseData[index].clientTaxonomyId, datapointId: responseData[index].datapointId, year: responseData[index].year }, { $set: responseData[index] }, { upsert: true })
        .catch((error) => {
          return res.status(500).json({
            status: "500",
            message: error.message ? error.message : "Failed to update actual value" 
          })
        });
    }
  }
  return res.status(200).json({ status: ("200"), message: "response updated for datapoints", count: responseData.length, data: responseData})
}

export const getPercentileByPillar = async ({body}, res, next) => {
  try {
    let percentileDatapoints = await Datapoints.find({
      "clientTaxonomyId": body.taxonomy, 
      "categoryId": body.pillar, 
      "percentile": "Yes", 
      "relevantForIndia" : "Yes", 
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
          'fiveYearsBackSD': '',
          'fourYearsBackSD': '',
          'threeYearsBackSD': '',
          'twoYearsBackSD': '',
          'oneYearBackSD': '',
           'projectedSd': ''
        };
        let sdYearNumber = 'fiveYearsBackSD';
        let avgYearNumber = 'fiveYearsBackAvg';
        for (let yIndex = 0; yIndex < years.length; yIndex++) {
          if (yIndex == 1) {
            sdYearNumber = 'fourYearsBackSD';
            avgYearNumber = 'fourYearsBackAvg';
          } else if(yIndex == 2) {
            sdYearNumber = 'threeYearsBackSD';
            avgYearNumber = 'threeYearsBackAvg';
          } else if(yIndex == 3) {
            sdYearNumber = 'twoYearsBackSD';
            avgYearNumber = 'twoYearsBackAvg';
          } else if(yIndex == 4) {
            sdYearNumber = 'oneYearBackSD';
            avgYearNumber = 'oneYearBackAvg';
          }
          let dpResponse = await ProjectedValues.findOne({ 
            clientTaxonomyId: body.taxonomy, 
            datapointId: percentileDatapoints[index].id, 
            year: years[yIndex], 
            nic: body.nicCode 
          }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Datapoints value not found for the '+ years[yIndex] + ' year!' }) });
          console.log("Datapoint Response", dpResponse);
          if (dpResponse) {
            yearObj[avgYearNumber] = dpResponse.actualAverage;
            yearObj[sdYearNumber] = dpResponse.actualStdDeviation;
          } else {
            yearObj[avgYearNumber] = '';
            yearObj[sdYearNumber] = '';
          }
        }
        let currentYearValues = await ProjectedValues.findOne({ 
          clientTaxonomyId: body.taxonomy, 
          datapointId: percentileDatapoints[index].id, 
          year: body.currentYear, 
          nic: body.nicCode
        }).catch((error) => { return res.status(500).json({ status: "500", message: error.message ? error.message : 'Current year value not found for '+ percentileDatapoints[index].code + ' code!' }) })
        if (currentYearValues) {
          yearObj[ 'projectedAvg'] = currentYearValues.actualAverage;
          yearObj[ 'projectedSd'] = currentYearValues.actualStdDeviation;
        } else{
          yearObj[ 'projectedAvg'] = '';
          yearObj[ 'projectedSd'] = '';
        }
        completeDetails.push(yearObj);
      }
      res.status(200).json({ status: ("200"), message: "data retrieved sucessfully", response: completeDetails });
    } else {
      res.status(500).json({ status: ("500"), message: "No percentile datapoints available!" });
    }    
  } catch (error) {
    res.status(500).json({ status: ("500"), message: error.message ? error.message : "No percentile datapoints available!" });
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
          nic: body.nicCode,
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
          "nic": body.nicCode
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
    res.status(500).json({ status: ("500"), message: error.message ? error.message : "No data available!" }); 
  }
}
