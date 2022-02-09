import mongoose, { Schema } from 'mongoose'
import { Companies } from "../companies";
import { CompaniesTasks } from "../companies_tasks";
import { StandaloneDatapoints } from "../standalone_datapoints";
import { ClientTaxonomy } from "../clientTaxonomy";
import _ from 'lodash'
import { Datapoints } from '../datapoints'

export const create = ({ body }, res, next) =>
  res.status(201).json(body)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  res.status(200).json([])

export const reportsFilter = async(req, res, next) => {
  const { clientTaxonomyId, nicList, yearsList, pillarList, searchQuery, page, limit } = req.body;
  let matchQuery = { status: true };
  if (clientTaxonomyId) {
    let companyFindQuery = { clientTaxonomyId: clientTaxonomyId, status: true };
    if (nicList.length > 0) {
      let nics = [];
      for (let nicIndex = 0; nicIndex < nicList.length; nicIndex++) {
        nics.push(nicList[nicIndex].value);
      }
      companyFindQuery.nic = { $in: nics };
    }
    if(searchQuery != ''){
      companyFindQuery.companyName = { "$regex" : searchQuery , "$options" : "i"};
    }
    let companyIds = await Companies.find(companyFindQuery).distinct('_id');
    matchQuery.companyId = { $in: companyIds };
    if (yearsList.length > 0) {
      let years = [];
      for (let yearIndex = 0; yearIndex < yearsList.length; yearIndex++) {
        years.push(yearsList[yearIndex].value);
      }
      matchQuery.year = { $in: years };
    }
    if (pillarList.length > 0) {
      let pillars = [];
      for (let pillarIndex = 0; pillarIndex < pillarList.length; pillarIndex++) {
        pillars.push(mongoose.Types.ObjectId(pillarList[pillarIndex].value));
      }
      matchQuery.categoryId = { $in: pillars };
    }
  } else {
    return res.status(400).json({ status: "400", message: "clientTaxonomyId is missing!", count: 0, rows: [] });
  }
  let aggregateQuery = [
    {
      $lookup: {
        from: "taskassignments",
        localField: "taskId",
        foreignField: "_id",
        as: "taskDetails"
      }
    },
    {
      $lookup: {
        from: "companies",
        localField: "companyId",
        foreignField: "_id",
        as: "companyDetails"
      }
    },
    { $unwind:"$companyDetails" },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryDetails"
      }
    }, 
    { $unwind:"$categoryDetails" },
    { $match: matchQuery },
    {
      $project: {
        "companyId": "$companyId",
        "companyName": "$companyDetails.companyName",
        "cin": "$companyDetails.cin",
        "nicCode": "$companyDetails.nic",
        "nicIndustry": "$companyDetails.nicIndustry",
        "year": "$year",
        "pillar": "$categoryDetails.categoryName",
        "isChecked": { $toBool: false }
      }
    }
  ];
  let allRecords = await CompaniesTasks.aggregate(aggregateQuery);
  aggregateQuery.push({ "$skip": page != '0' ? Number(page-1) * Number(limit) : 0 });
  aggregateQuery.push({ "$limit": Number(limit) });
  await CompaniesTasks.aggregate(aggregateQuery)
  .then((rows) => {
    return res.status(200).json({ status: "200", message: "Retrieved Reports successfully!", count: allRecords.length ? allRecords.length : 0, rows: rows ? rows : [] });
  });
}

export const exportReport  = async(req, res, next) => {
  const { clientTaxonomyId, selectedCompanies, yearsList, pillarList } = req.body;
  let matchQuery = { status: true, isActive: true }, datapointFindQuery = { status: true }, datapointIds = [];
  if (clientTaxonomyId && selectedCompanies.length > 0) {
    datapointFindQuery.clientTaxonomyId = clientTaxonomyId;
    matchQuery.companyId = { $in: selectedCompanies };
    if (yearsList.length > 0) {
      let years = [];
      for (let yearIndex = 0; yearIndex < yearsList.length; yearIndex++) {
        years.push(yearsList[yearIndex].value);
      }
      matchQuery.year = { $in: years };
    }
    if (pillarList.length > 0) {
      let pillars = [];
      for (let pillarIndex = 0; pillarIndex < pillarList.length; pillarIndex++) {
        pillars.push(mongoose.Types.ObjectId(pillarList[pillarIndex].value));
      }
      datapointFindQuery.categoryId = { $in: pillars };
      datapointIds = await Datapoints.find(datapointFindQuery).distinct('_id');
      matchQuery.datapointId = { $in: datapointIds };
    }
  } else {
    if (!clientTaxonomyId) {
      return res.status(400).json({ status: "400", message: "clientTaxonomyId is missing!", count: 0, rows: [] });
    } else {
      return res.status(400).json({ status: "400", message: "No company is selected!", count: 0, rows: [] });
    }
  }
  let dsntDatapointIds = await Datapoints.distinct('_id',{
    clientTaxonomyId: clientTaxonomyId,
    status: true,
    // isRequiredForJSON: true
  })
  matchQuery.datapointId = dsntDatapointIds;
  const [ allStandaloneDetails, clientTaxonomyDetail, datapointDetails ] = await Promise.all([
    StandaloneDatapoints.find(matchQuery)
  .populate('companyId')
  .populate('datapointId')
  .populate([{
    path: "datapointId",
    populate: {
      path: "categoryId"
    },
    populate: {
      path: "keyIssueId"
    },
    populate: {
      path: "themeId"
    },
    populate: {
      path: "functionId"
    }
  }]),
  ClientTaxonomy.findById(clientTaxonomyId),
  Datapoints.find({
    clientTaxonomyId: clientTaxonomyId,
    status: true,
    // isRequiredForJSON: true
  })
  .populate('categoryId')
  .populate('themeId')
  .populate('keyIsuueId')
]);

  console.log('allStandaloneDetails', allStandaloneDetails.length);
  if (allStandaloneDetails.length > 0 && clientTaxonomyDetail && clientTaxonomyDetail.outputFields && clientTaxonomyDetail.outputFields.additionalFields.length > 0) {
    let rows = [];
    // let element = {
    //   "Item Code": "",
    //   "Item Criteria" : "",
    //   "Category" : "",
    //   "bvd9" : "",
    //   "name_of_company": "",
    //   "year" : "",
    //   "business_element_required_framework" : "",
    //   "Description" : "",
    //   "Expected Result" : "",
    //   "data_value" : "",
    //   "data_type (number, text, units)" : "",
    //   "did_the_company_report" : "",
    //   "date_of_data_capture" : "",
    //   "type of value(actual/derived/Proxy)" : "",
    //   "company_data_element_label (for numbers)" : "",
    //   "company_data_element_sub_label (for numbers)" : "",
    //   "relevant_standards_and_frameworks" : "",
    //   "total_or_sub_line_item (for numbers)" : "",
    //   "format_of_data_provided_by_company (chart, table, text)" : "",
    //   "supporting_narrative" : "",
    //   "section_of_document" : "",
    //   "page_number" : "",
    //   "name_of_document_as_saved" : "",
    //   "name_of_document (as listed on title page)" : "",
    //   "HTML Link of Document" : "",
    //   "Snapshot" : "",
    //   "Document Year" : "",
    //   "keyword_used" : "",
    //   "comment" : "",
    //   "Error Type" : "",
    //   "Error Comments" : "",
    //   "Analyst Comment" : "",
    //   "Addition Source Used?" : ""
    // }
    for (let stdIndex = 0; stdIndex < allStandaloneDetails.length; stdIndex++) {
      let dpCodeDetails = datapointDetails.filter(obj =>  obj.id == allStandaloneDetails[stdIndex].datapointId['id']) 

       let Year =  allStandaloneDetails[stdIndex].year.split('-',);
       
        let resObj = {
          "Item Code" : dpCodeDetails[0].code ? dpCodeDetails[0].code : "NI",
          "Item Criteria" : dpCodeDetails[0].themeId ? dpCodeDetails[0].themeId.themeName : "NI",
          "Category" : dpCodeDetails[0].categoryId ? dpCodeDetails[0].categoryId.categoryName : "NI",
          "bvd9" : allStandaloneDetails[stdIndex].companyId ? allStandaloneDetails[stdIndex].companyId.cin : '',
          "name_of_company" : allStandaloneDetails[stdIndex].companyId ? allStandaloneDetails[stdIndex].companyId.companyName : '',
          "year" : Year.length > 1 ? Year[0].trim(' ') : 'NI',
          "business_element_required_framework" : dpCodeDetails[0].keyIssueId ? dpCodeDetails[0].keyIssueId.keyIssueName : "NI",
          "Description" : dpCodeDetails[0].description ? dpCodeDetails[0].description : "NI",
          "Expected Result" : dpCodeDetails[0].unit ? dpCodeDetails[0].unit : "NI",
          "data_value" : allStandaloneDetails[stdIndex].response ? allStandaloneDetails[stdIndex].response : 'NI',
          "data_type (number, text, units)" : dpCodeDetails[0].dataType ? dpCodeDetails[0].dataType : "NI",
          "did_the_company_report" : allStandaloneDetails[stdIndex].did_the_company_report ? allStandaloneDetails[stdIndex].did_the_company_report : 'NI',
          "date_of_data_capture" : allStandaloneDetails[stdIndex].date_of_data_capture ? allStandaloneDetails[stdIndex].date_of_data_capture : 'NI',
          "type of value(actual/derived/Proxy)" : allStandaloneDetails[stdIndex].type_of_value ? allStandaloneDetails[stdIndex].type_of_value : 'NI',
          "company_data_element_label (for numbers)" : allStandaloneDetails[stdIndex].company_data_element_label ? allStandaloneDetails[stdIndex].company_data_element_label : 'NI',
          "company_data_element_sub_label (for numbers)" : allStandaloneDetails[stdIndex].company_data_element_sub_label ? allStandaloneDetails[stdIndex].company_data_element_sub_label : 'NI',
          "relevant_standards_and_frameworks" : allStandaloneDetails[stdIndex].relevant_standards_and_frameworks ? allStandaloneDetails[stdIndex].relevant_standards_and_frameworks : 'NI',
          "total_or_sub_line_item (for numbers)" : allStandaloneDetails[stdIndex].total_or_sub_line_item ? allStandaloneDetails[stdIndex].total_or_sub_line_item : 'NI',
          "format_of_data_provided_by_company (chart, table, text)" : allStandaloneDetails[stdIndex].format_of_data_provided_by_company ? allStandaloneDetails[stdIndex].format_of_data_provided_by_company : 'NI',
          "supporting_narrative" : allStandaloneDetails[stdIndex].textSnippet ? allStandaloneDetails[stdIndex].textSnippet : 'NI',
          "section_of_document" : allStandaloneDetails[stdIndex].section_of_document ? allStandaloneDetails[stdIndex].section_of_document : 'NI',
          "page_number" : allStandaloneDetails[stdIndex].pageNumber ? allStandaloneDetails[stdIndex].pageNumber : 'NI',
          "name_of_document_as_saved" : allStandaloneDetails[stdIndex].sourceFile ? allStandaloneDetails[stdIndex].sourceFile : 'NI',
          "name_of_document (as listed on title page)" : allStandaloneDetails[stdIndex].sourceName ? allStandaloneDetails[stdIndex].sourceName : 'NI',
          "HTML Link of Document" : allStandaloneDetails[stdIndex].url ? allStandaloneDetails[stdIndex].url : 'NI',
          "Snapshot" : allStandaloneDetails[stdIndex].screenShot ? allStandaloneDetails[stdIndex].screenShot : 'NI',
          "Document Year" : allStandaloneDetails[stdIndex].documentYear ? allStandaloneDetails[stdIndex].documentYear : 'NI',
          "keyword_used" : allStandaloneDetails[stdIndex].keyword_used ? allStandaloneDetails[stdIndex].keyword_used : 'NI',
          "comment" : allStandaloneDetails[stdIndex].comment ? allStandaloneDetails[stdIndex].comment : 'NI',
          "Error Type" : allStandaloneDetails[stdIndex].errorType ? allStandaloneDetails[stdIndex].errorType : 'NI',
          "Error Comments" : allStandaloneDetails[stdIndex].errorComments ? allStandaloneDetails[stdIndex].errorComments : 'NI',
          "Analyst Comment" : allStandaloneDetails[stdIndex].optionalAnalystComment ? allStandaloneDetails[stdIndex].optionalAnalystComment : 'NI',
          "Addition Source Used?" : allStandaloneDetails[stdIndex].additionSourceUsed ? allStandaloneDetails[stdIndex].additionSourceUsed : 'NI',
        }

      // objectToPush[clientTaxonomyDetail.outputFields['cin'].displayName] = allStandaloneDetails[stdIndex].companyId ? allStandaloneDetails[stdIndex].companyId.cin : '';
      // objectToPush[clientTaxonomyDetail.outputFields['companyName'].displayName] = allStandaloneDetails[stdIndex].companyId ? allStandaloneDetails[stdIndex].companyId.companyName : '';
      // clientTaxonomyDetail.outputFields.additionalFields.push(clientTaxonomyDetail.outputFields['cin']);
      // clientTaxonomyDetail.outputFields.additionalFields.push(clientTaxonomyDetail.outputFields['companyName']);
      // console.log("before sorting");
      // clientTaxonomyDetail.outputFields.additionalFields = _.sortBy(clientTaxonomyDetail.outputFields.additionalFields, 'orderNumber');
      // console.log("after sorting");
      // for (let outIndex = 0; outIndex < clientTaxonomyDetail.outputFields.additionalFields.length; outIndex++) {
      //   if (allStandaloneDetails[stdIndex][clientTaxonomyDetail.outputFields.additionalFields[outIndex].fieldName]) {
      //     objectToPush[clientTaxonomyDetail.outputFields.additionalFields[outIndex].displayName] = allStandaloneDetails[stdIndex][clientTaxonomyDetail.outputFields.additionalFields[outIndex].fieldName];
      //   } else if (allStandaloneDetails[stdIndex].additionalDetails[clientTaxonomyDetail.outputFields.additionalFields[outIndex].fieldName]) {
      //     objectToPush[clientTaxonomyDetail.outputFields.additionalFields[outIndex].displayName] = allStandaloneDetails[stdIndex].additionalDetails[clientTaxonomyDetail.outputFields.additionalFields[outIndex].fieldName];
      //   }
      // }
      rows.push(resObj);
    }
    return res.status(200).json({ 
      status: "200", 
      message: "Data exported successfully!", 
      data: rows.length > 0 ? rows : [] 
    });
  } else {
    return res.status(500).json({ 
      status: "500", 
      message: "Output fields not configured yet for this Client Taxonomy, Please configure now!", 
      data: [] 
    });  
  }
}
