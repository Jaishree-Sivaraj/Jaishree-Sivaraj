import mongoose, { Schema } from 'mongoose'
import { Companies } from "../companies";
import { CompaniesTasks } from "../companies_tasks";
import { StandaloneDatapoints } from "../standalone_datapoints";
import { ClientTaxonomy } from "../clientTaxonomy";

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

  const [ allStandaloneDetails, clientTaxonomyDetail ] = await Promise.all([
    StandaloneDatapoints.find(matchQuery)
  .populate('companyId')
  .populate('datapointId')
  .populate({
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
  }),
  ClientTaxonomy.findById(clientTaxonomyId)
]);

  console.log('allStandaloneDetails', allStandaloneDetails.length);
  let rows = [];
  if (allStandaloneDetails.length > 0 && clientTaxonomyDetail && clientTaxonomyDetail.outputFields && clientTaxonomyDetail.outputFields.additionalFields.length > 0) {
    for (let stdIndex = 0; stdIndex < allStandaloneDetails.length; stdIndex++) {
      let objectToPush = {};
      objectToPush[clientTaxonomyDetail.outputFields['cin'].displayName] = allStandaloneDetails[stdIndex].companyId ? allStandaloneDetails[stdIndex].companyId.cin : '';
      objectToPush[clientTaxonomyDetail.outputFields['companyName'].displayName] = allStandaloneDetails[stdIndex].companyId ? allStandaloneDetails[stdIndex].companyId.companyName : '';

      clientTaxonomyDetail.outputFields.additionalFields = _.sortBy(clientTaxonomyDetail.outputFields.additionalFields, 'orderNumber');
      for (let outIndex = 0; outIndex < clientTaxonomyDetail.outputFields.additionalFields.length; outIndex++) {
        if (allStandaloneDetails[stdIndex][clientTaxonomyDetail.outputFields.additionalFields[outIndex].fieldName]) {
          objectToPush[clientTaxonomyDetail.outputFields.additionalFields[outIndex].displayName] = allStandaloneDetails[stdIndex][clientTaxonomyDetail.outputFields.additionalFields[outIndex].fieldName];
        }
      }
      rows.push(objectToPush);
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
