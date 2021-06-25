import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Validations } from '.'
import { Datapoints } from '../datapoints'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { DerivedDatapoints } from '../derived_datapoints'
import _ from 'lodash'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Validations.create({ ...body, createdBy: user })
    .then((validations) => validations.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Validations.count(query)
    .then(count => Validations.find(query, select, cursor)
      .populate('createdBy')
      .populate('datapointId')
      .then((validations) => ({
        count,
        rows: validations.map((validations) => validations.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Validations.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then((validations) => validations ? validations.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Validations.findById(params.id)
    .populate('createdBy')
    .populate('datapointId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((validations) => validations ? Object.assign(validations, body).save() : null)
    .then((validations) => validations ? validations.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Validations.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((validations) => validations ? validations.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const type8Validation = async ({ user, body }, res, next) => {
  console.log(body.datapointId, body.companyId, body.clientTaxonomyId, body.currentYear, body.previousYear, body.response);
  let derivedDatapoints = await DerivedDatapoints.find({ companyId: body.companyId, status: true }).populate('datapointId');
  let standalone_datapoints = await StandaloneDatapoints.find({ companyId: body.companyId, status: true }).populate('datapointId');
  let mergedDetails = _.concat(derivedDatapoints, standalone_datapoints);
  let datapointDetails = await Datapoints.findOne({ _id: body.datapointId, clientTaxonomyId: body.clientTaxonomyId });
  if (datapointDetails.methodName.trim() == 'OR') {
    let parameters = datapointDetails.dependentCodes;
    if (parameters.length > 0) {
      for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
        let parameterDPResponse, previousYearResponse;
        _.filter(mergedDetails, (object, index) => {
          if (object.companyId == body.companyId, object.year == body.currentYear, object.datapointId.id == parameters[parameterIndex].id) {
            parameterDPResponse = object;
          } else if (object.companyId == body.companyId, object.year == body.previousYear, object.datapointId.id == body.datapointId) {
            previousYearResponse = object;
          }
        })
        console.log(parameterDPResponse, previousYearResponse)
        if (parameterDPResponse) {
          if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
            if (datapointDetails.checkCondition.trim() == 'greater') {
              let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
              if (Number(body.response) > Number(calculatedResponse)) {
                return res.status(200).json({ message: "Valid Response", isValidResponse: true });
              } else {
                return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
              }
            } else {
              let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
              if (Number(body.response) < Number(calculatedResponse)) {
                return res.status(200).json({ message: "Valid Response", isValidResponse: true });
              } else {
                return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
              }
            }
          }
        } else {
          return res.status(404).json({ message: "Response is missing for " + parameters[parameterIndex].code + "year :"+ body.currentYear});
        }
        if (parameterIndex == parameters.length - 1) {
          return res.status(412).json({ message: "Condition Failed" });
        }
      }
    } else {
      return res.status(401).json({ message: "Parameters not found" });
    }
  } else if (datapointDetails.methodName.trim() == 'YES') {
    let parameter = datapointDetails.dependentCodes;
    let parameterDPResponse, previousYearResponse;
    _.filter(mergedDetails, (object, index) => {
      if (object.companyId == body.companyId, object.year == body.currentYear, object.datapointId.id == parameter[0].id) {
        parameterDPResponse = object;
      } else if (object.companyId == body.companyId, object.year == body.previousYear, object.datapointId.id == body.datapointId) {
        previousYearResponse = object;
      }
    })
    if (parameterDPResponse) {
      if (parameterDPResponse.response.toLowerCase() == 'yes' || parameterDPResponse.response.toLowerCase() == 'y') {
        if (datapointDetails.checkCondition.trim() == 'greater') {
          let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
          if (Number(body.response) > Number(calculatedResponse)) {
            return res.status(200).json({ message: "Valid Response", isValidResponse: true });
          } else {
            return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
          }
        } else {
          let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
          if (Number(body.response) < Number(calculatedResponse)) {
            return res.status(200).json({ message: "Valid Response", isValidResponse: true });
          } else {
            return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
          }
        }
      } else {
        return res.status(412).json({ message: "Condition Failed" });
      }
    } else {
      return res.status(404).json({ message: "Response is missing for " + parameter[0].code + "year :"+ body.currentYear});
    }
  } else if (datapointDetails.methodName.trim() == 'ANDOR') {
    let parameters = datapointDetails.dependentCodes;
    let param1Value, param2Value, param3Value;
    let previousYearResponse;
    //let year;
    _.filter(mergedDetails, (object, index) => {
      if (object.companyId == body.companyId, object.year == body.previousYear, object.datapointId == body.datapointId) {
        previousYearResponse = object
      } else if (object.datapointId == parameters[0].id, object.year == body.currentYear) {
        param1Value = object.response ? object.response : ''
      } else if (object.datapointId == parameters[1].id, object.year == body.currentYear) {
        param2Value = object.response ? object.response : ''
      } else if (object.datapointId == parameters[2].id, object.year == body.currentYear) {
        param3Value = object.response ? object.response : ''
      }
    })
    //if ((param1Value.toLowerCase() == 'yes' && param2Value.toLowerCase() == 'yes') || param3Value.toLowerCase() == 'yes') {
      if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes')) || (param3Value == 'yes' || param3Value == 'Yes')) {
      if (datapointDetails.checkCondition.trim() == 'greater') {
        let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
        if (Number(body.response) > Number(calculatedResponse)) {
          return res.status(200).json({ message: "Valid Response", isValidResponse: true });
        } else {
          return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
        }
      } else {
        let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
        if (Number(body.response) < Number(calculatedResponse)) {
          return res.status(200).json({ message: "Valid Response", isValidResponse: true });
        } else {
          return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
        }
      }
    } else {
      return res.status(412).json({ message: "Condition Failed" });
    }
  } else if (datapointDetails.methodName.trim() == 'ANDOR3') {
    console.log('...',datapointDetails);
    let parameters = datapointDetails.dependentCodes;
    let param1Value, param2Value, param3Value, param4Value;
    let previousYearResponse;
    _.filter(mergedDetails, (object, index) => {
      if (object.companyId == body.companyId, object.year == body.previousYear, object.datapointId == body.datapointId) {
        previousYearResponse = object
      } else if (object.datapointId == parameters[0].id, object.year == body.currentYear) {
        param1Value = object.response ? object.response : ''
      } else if (object.datapointId == parameters[1].id, object.year == body.currentYear) {
        param2Value = object.response ? object.response : ''
      } else if (object.datapointId == parameters[2].id, object.year == body.currentYear) {
        param3Value = object.response ? object.response : ''
      } else if (object.datapointId == parameters[3].id, object.year == body.currentYear) {
        param4Value = object.response ? object.response : ''
      }
    })
    //if ((param1Value.toLowerCase() == 'yes' && param2Value.toLowerCase() == 'yes' && param3Value.toLowerCase() == 'yes') || param4Value.toLowerCase() == 'yes') {
      if (((param1Value == 'yes' || param1Value == 'Yes') && (param2Value == 'yes' || param2Value == 'Yes') && (param3Value == 'yes' || param3Value == 'yes') || (param4Value == 'yes' || param4Value == 'Yes'))) {
      if (datapointDetails.checkCondition.trim() == 'greater') {
        let calculatedResponse = (Number(datapointDetails.percentileThresholdValue.replace('%', '')) / 100) * Number(previousYearResponse.response);
        if (Number(body.response) > Number(calculatedResponse)) {
          return res.status(200).json({ message: "Valid Response", isValidResponse: true });
        } else {
          return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
        }
      }
    } else {
      return res.status(412).json({ message: "Condition Failed" });
    }
  }
}

export const type3Validation = async ({ user, body }, res, next) => {
  console.log(body.datapointId, body.companyId, body.clientTaxonomyId, body.previousYear, body.response);
  let previousResponse = await StandaloneDatapoints.findOne({ datapointId: body.datapointId, companyId: body.companyId, year: body.previousYear });
  try {
    if (previousResponse.response.toLowerCase() == 'yes' || previousResponse.response.toLowerCase() == 'y') {
      if (body.response.toLowerCase() == 'yes' || body.response.toLowerCase() == 'y') {
        return res.status(200).json({ message: "Valid Response", isValidResponse: true });
      } else {
        return res.status(400).json({ message: "Invalid Response", isValidResponse: false });
      }
    } else {
      return res.status(200).json({ message: "Valid Response", isValidResponse: true });
    }
  } catch (error) {
    return res.status(412).json({ message: error.message, isValidResponse: false });
  }
}