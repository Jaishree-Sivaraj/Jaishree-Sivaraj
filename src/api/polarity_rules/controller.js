import _ from 'lodash'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { PolarityRules } from '../polarity_rules'
import { Companies } from '../companies'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { Datapoints } from '../datapoints'
import { DerivedDatapoints } from '../derived_datapoints'
import { Ztables } from '../ztables'
import { Company } from '../companies'
import { conditionalExpression } from '@babel/types'

export const create = ({ user, bodymen: { body } }, res, next) =>
  PolarityRules.create({ ...body, createdBy: user })
    .then((polarityRules) => polarityRules.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  PolarityRules.count(query)
    .then(count => PolarityRules.find(query, select, cursor)
      .populate('createdBy')
      .populate('datapointId')
      .then((polarityRules) => ({
        count,
        rows: polarityRules.map((polarityRules) => polarityRules.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  PolarityRules.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then((polarityRules) => polarityRules ? polarityRules.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  PolarityRules.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((polarityRules) => polarityRules ? Object.assign(polarityRules, body).save() : null)
    .then((polarityRules) => polarityRules ? polarityRules.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  PolarityRules.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((polarityRules) => polarityRules ? polarityRules.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const percentileCalculation = async ({ user, params }, res, next) => {
  let nic = params.nic ? params.nic : '';
  let nicCompaniesList = await Companies.find({ "nic": nic, status: true }).populate('createdBy');
  let nicCompaniesIds = [];
  for (let companyIndex = 0; companyIndex < nicCompaniesList.length; companyIndex++) {
    nicCompaniesIds.push(nicCompaniesList[companyIndex].id);
  }
  console.log(nicCompaniesIds);
  let distinctYears = await StandaloneDatapoints.distinct('year', { companyId: { $in: nicCompaniesIds },isActive: true, status: true });
  if (distinctYears.length > 0) {
    for (let yearIndex = 0; yearIndex < distinctYears.length; yearIndex++) {
      const year = distinctYears[yearIndex];
      let percentileDatapointsList = await Datapoints.find({ "percentile": "Yes" }).populate('updatedBy').populate('keyIssueId').populate('functionId');
      console.log('percentileDatapointsList', percentileDatapointsList);
      console.log('percentileDatapointsList.length', percentileDatapointsList.length);
      if (percentileDatapointsList.length > 0) {
        for (let pdpIndex = 0; pdpIndex < percentileDatapointsList.length; pdpIndex++) {
          if (percentileDatapointsList[pdpIndex].dataCollection.toLowerCase() == "yes" || percentileDatapointsList[pdpIndex].dataCollection.toLowerCase() == "y") {
            //Find the datapoint response value in StandaloneDatapoints collection           
            let dpResponseOfNicCompanies = await StandaloneDatapoints.find({ companyId: { $in: nicCompaniesIds }, datapointId: percentileDatapointsList[pdpIndex].id, year: year, isActive: true,status: true }, { response: 1, _id: 0 });
            if(percentileDatapointsList[pdpIndex].code == "EMQR002" && year == "2020-2021"){
              console.log("data :", percentileDatapointsList[pdpIndex].code)
            } 
            console.log('dpResponseOfNicCompanies', dpResponseOfNicCompanies);
            let filteredDpResponses = [];
            _.filter(dpResponseOfNicCompanies, (currentObject, index) => {
              if (currentObject.response !== '' && currentObject.response !== ' ' && currentObject.response.toLowerCase() != "na") {
                filteredDpResponses.push(currentObject.response ? currentObject.response.toString() : currentObject.response);
              }
            });
            let stdDeviation, averageValue;
            if (filteredDpResponses.length > 1) {
              console.log(filteredDpResponses);
              //calculate average and SD
              filteredDpResponses = filteredDpResponses.filter(e => e != "NA");
              filteredDpResponses = filteredDpResponses.filter(e => e.trim());
              filteredDpResponses = filteredDpResponses.map(e => Number(e));              
              console.log(filteredDpResponses);
              if (filteredDpResponses.length > 1) {
                averageValue = filteredDpResponses.reduce((prev, next) => prev + next) / filteredDpResponses.length;
                averageValue = Number(averageValue).toFixed(4);
                stdDeviation = Math.sqrt(filteredDpResponses.map(x => Math.pow(x - averageValue, 2)).reduce((a, b) => a + b) / (filteredDpResponses.length - 1));
                stdDeviation = Number(stdDeviation).toFixed(4);
              } else {
                stdDeviation = 'NA';
              }
            } else {
              stdDeviation = 'NA';
            }
            console.log('stdDeviation', stdDeviation);
            for (let cmpIndex = 0; cmpIndex < nicCompaniesList.length; cmpIndex++) {
              const element = nicCompaniesList[cmpIndex];
              let foundResponse = await StandaloneDatapoints.findOne({ companyId: nicCompaniesList[cmpIndex].id, datapointId: percentileDatapointsList[pdpIndex].id, year: year, isActive: true,status: true });
              if (foundResponse) {
                if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response.toLowerCase() == 'na') {
                  await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { response: 'NA', performanceResult: 'NA' } });
                } else {
                  let polarityDetail = await Datapoints.findOne({ _id: percentileDatapointsList[pdpIndex].id });
                  let zscoreValue;
                  if (stdDeviation == 'NA') {
                    console.log(stdDeviation)
                    await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA' } });
                  } else {
                    if (polarityDetail.polarity == 'Positive') {
                      zscoreValue = (Number(foundResponse.response) - Number(averageValue)) / Number(stdDeviation);
                    } else if (polarityDetail.polarity == 'Negative') {
                      zscoreValue = (Number(averageValue) - Number(foundResponse.response)) / Number(stdDeviation);
                    }
                    // Using zscore value we need to find out percentile value
                    if (zscoreValue > 4) {
                      await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '100', standaradDeviation : stdDeviation, average : averageValue} });
                    } else if (zscoreValue < -4) {
                      await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '0', standaradDeviation : stdDeviation, average : averageValue} });
                    } else if (zscoreValue == 'NA') {
                      await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA', standaradDeviation : stdDeviation, average : averageValue } });
                    } else {
                      //round of zscore value to two digit decimal value
                      if (zscoreValue) {
                        let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                        var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                        let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                        let zValues = ztableValue.values[0].split(",");
                        let zScore = zValues[Number(lastDigit)]
                        let percentile = zScore * 100;
                        percentile = Number(percentile).toFixed(4);
                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: percentile, standaradDeviation : stdDeviation, average : averageValue} });
                      } else {
                        await StandaloneDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA', standaradDeviation : stdDeviation, average : averageValue } });
                      }
                    }
                  }
                }
              }
            }
          } else {
            //Find the datapoint response value in DerivedDatapoints collection
            let dpResponseOfNicCompanies = await DerivedDatapoints.find({ companyId: { $in: nicCompaniesIds }, datapointId: percentileDatapointsList[pdpIndex].id, year: year, status: true }, { response: 1, _id: 0 });
            let filteredDpResponses = [];
            for (let resIndex = 0; resIndex < dpResponseOfNicCompanies.length; resIndex++) {
              const currentObject = dpResponseOfNicCompanies[resIndex];
              if (currentObject.response != "NA" && currentObject.response != "" && currentObject.response != " ") {
                filteredDpResponses.push(currentObject.response ? currentObject.response.toString() : currentObject.response);
              }
            }
            let stdDeviation;
            let averageValue;
            if (filteredDpResponses.length > 1) {
              //calculate average and SD
              filteredDpResponses = filteredDpResponses.filter(e => e != "NA");
              filteredDpResponses = filteredDpResponses.filter(e => e.trim());
              filteredDpResponses = filteredDpResponses.map(e => Number(e));
              if (filteredDpResponses.length > 1) {
                averageValue = filteredDpResponses.reduce((prev, next) => prev + next) / filteredDpResponses.length;
                averageValue = Number(averageValue).toFixed(4);
                stdDeviation = Math.sqrt(filteredDpResponses.map(x => Math.pow(x - averageValue, 2)).reduce((a, b) => a + b) / (filteredDpResponses.length - 1));
                stdDeviation = Number(stdDeviation).toFixed(4);
              } else {
                stdDeviation = 'NA';
              }
            } else {
              stdDeviation = 'NA';
            }
            for (let compIndex = 0; compIndex < nicCompaniesList.length; compIndex++) {
              const element = nicCompaniesList[compIndex];
              let foundResponse = await DerivedDatapoints.findOne({ companyId: nicCompaniesList[compIndex].id, datapointId: percentileDatapointsList[pdpIndex].id, year: year, status: true });
              if (foundResponse) {
                if (foundResponse.response == '' || foundResponse.response == ' ' || foundResponse.response.toLowerCase() == 'na') {
                  await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { response: 'NA', performanceResult: 'NA' } });
                } else {
                  let polarityDetail = await Datapoints.findOne({ _id: percentileDatapointsList[pdpIndex].id });
                  let zscoreValue;
                  if (polarityDetail.polarity == 'Positive') {
                    zscoreValue = (Number(foundResponse.response) - Number(averageValue)) / Number(stdDeviation);
                  } else if (polarityDetail.polarity == 'Negative') {
                    zscoreValue = (Number(averageValue) - Number(foundResponse.response)) / Number(stdDeviation);
                  }
                  // Using zscore value we need to find out percentile value
                  if (zscoreValue > 4) {
                    await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '100', standaradDeviation : stdDeviation, average : averageValue } });
                  } else if (zscoreValue < -4) {
                    await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: '0', standaradDeviation : stdDeviation, average : averageValue } });
                  } else if (zscoreValue == 'NA') {
                    await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA', standaradDeviation : stdDeviation, average : averageValue } });
                  } else {
                    //round of zscore value to two digit decimal value
                    if (zscoreValue) {
                      let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
                      var lastDigit = twoDigitZscoreValue.toString().slice(-1);
                      let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
                      let zValues = ztableValue.values[0].split(",");
                      let zScore = zValues[Number(lastDigit)]
                      let percentile = zScore * 100;
                      percentile = Number(percentile).toFixed(4);
                      await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: percentile, standaradDeviation : stdDeviation, average : averageValue } });
                    } else {
                      await DerivedDatapoints.updateOne({ _id: foundResponse.id }, { $set: { performanceResult: 'NA', standaradDeviation : stdDeviation, average : averageValue } });
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (distinctYears.length-1 == yearIndex) {
        return res.status(200).json({ message: "Percentile calculated successfully!" });      
      }
    }
  }
  return res.status(200).json({ message: "Percentile calculated successfully!" });
}


export const mockPercentileCalculation = async ({ user, body }, res, next) => {
  let zscoreValue ,performanceResult ;
  let datapointsDetails = await DerivedDatapoints.findOne({ _id: body.datapointId });
  if (datapointsDetails.polarity == 'Positive') {
    zscoreValue = (Number(body.response) - Number(body.average)) / Number(body.standardDeviation);
  } else {
    zscoreValue = (Number(body.average) - Number(body.response)) / Number(body.standardDeviation);
  }
  if (zscoreValue > 4) {
    performanceResult = 100
  } else if (zscoreValue < -4) {
    performanceResult = 0
  } else if (zscoreValue == 'NA') {
    performanceResult = 'NA'
  } else {
    //round of zscore value to two digit decimal value
    if (zscoreValue) {
      let twoDigitZscoreValue = zscoreValue.toFixed(2) + 0.01;
      var lastDigit = twoDigitZscoreValue.toString().slice(-1);
      let ztableValue = await Ztables.findOne({ zScore: zscoreValue.toFixed(1) });
      let zValues = ztableValue.values[0].split(",");
      let zScore = zValues[Number(lastDigit)]
      performanceResult = zScore * 100;
    } else {
      performanceResult = 'NA'
    }
  }
  return res.status(200).json({ message: "Percentile calculated ", PerformanceResult:performanceResult });
}

export const extraAddKeys = async({params}, res, next)=>{
  try { 
  let polarityRulesId = await PolarityRules.find({}).populate({
    path: "datapointId",
    populate: {
      path: "categoryId"
    }
 });
 console.log(polarityRulesId)
  if(polarityRulesId && polarityRulesId.length > 0){
    for (let polarityRulesIndex = 0; polarityRulesIndex < polarityRulesId.length; polarityRulesIndex++) {
      console.log(polarityRulesId[polarityRulesIndex].id)
      await PolarityRules.updateOne({_id: polarityRulesId[polarityRulesIndex].id},{$set:{categoryId: polarityRulesId[polarityRulesIndex].datapointId.categoryId.id }})
    }
    return res.status(200).json({ status: "200", message: "Extra-keys added for polarity rules!" });
  } else {
    return res.status(404).json({ message: "No polarity rules found!" });
  }   
} catch (error) {
  return res.status(500).json({ message: error.message });
}

}
