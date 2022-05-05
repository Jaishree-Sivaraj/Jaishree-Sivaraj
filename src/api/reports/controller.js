import mongoose, { Schema } from 'mongoose'
import { Companies } from "../companies";
import { CompaniesTasks } from "../companies_tasks";
import { StandaloneDatapoints } from "../standalone_datapoints";
import { Group } from "../group";
import { ClientTaxonomy } from "../clientTaxonomy";
import _ from 'lodash'
import { Datapoints } from '../datapoints'
import { ChildDp } from '../child-dp'
import { CompanySources } from '../companySources'
import { TaskAssignment } from '../taskAssignment'
import { Batches } from '../batches'
import { Role } from '../role'
import { ErrorDetails } from '../errorDetails'

export const create = ({ body }, res, next) =>
  res.status(201).json(body)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  res.status(200).json([])

export const reportsFilter = async (req, res, next) => {
  const { clientTaxonomyId, nicList, yearsList, pillarList, batchList, filteredCompanies, page, limit } = req.body;
  let matchQuery = { status: true };
  if (clientTaxonomyId) {
    let companyFindQuery = { clientTaxonomyId: clientTaxonomyId, status: true };
    if (nicList && nicList?.length > 0) {
      let nics = [];
      for (let nicIndex = 0; nicIndex < nicList.length; nicIndex++) {
        nics.push(nicList[nicIndex].value);
      }
      companyFindQuery.nic = { $in: nics };
    }
    // if (searchQuery != '') {
    //   companyFindQuery.companyName = { "$regex": searchQuery, "$options": "i" };
    // }
    if (filteredCompanies && filteredCompanies.length > 0) {
      let filteredCompanyIds = [];
      for (let filtCmpIndex = 0; filtCmpIndex < filteredCompanies.length; filtCmpIndex++) {
        filteredCompanyIds.push(filteredCompanies[filtCmpIndex].value);
      }
      companyFindQuery._id = { $in: filteredCompanyIds };
    } else if (batchList && batchList?.length > 0) {
      let batchIds = [];
      for (let nicIndex = 0; nicIndex < batchList.length; nicIndex++) {
        batchIds.push(batchList[nicIndex].value);
      }
      let batchCompanyDetails = await Batches.find({_id: { $in: batchIds } }).populate('companiesList');
      let batchCompanyIds = [];
      for (let batchIndex = 0; batchIndex < batchCompanyDetails.length; batchIndex++) {
        let cmpItem = batchCompanyDetails[batchIndex].companiesList;
        for (let cmpIndex = 0; cmpIndex < cmpItem.length; cmpIndex++) {
          let companyItem = cmpItem[cmpIndex];
          if(!batchCompanyIds.includes(companyItem.id)){
            batchCompanyIds.push(companyItem.id);
          }
        }
      }
      companyFindQuery._id = { $in: batchCompanyIds };
    }
    let companyIds = await Companies.find(companyFindQuery).distinct('_id');
    matchQuery.companyId = { $in: companyIds };
    if (yearsList && yearsList?.length > 0) {
      let years = [];
      for (let yearIndex = 0; yearIndex < yearsList.length; yearIndex++) {
        years.push(yearsList[yearIndex].value);
      }
      matchQuery.year = { $in: years };
    }
    if (pillarList && pillarList?.length > 0) {
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
    { $unwind: "$companyDetails" },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryDetails"
      }
    },
    { $unwind: "$categoryDetails" },
    { $match: {...matchQuery, "taskDetails.taskStatus": { $ne: "Pending" }  } },
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
  aggregateQuery.push({ "$skip": page != '0' ? Number(page - 1) * Number(limit) : 0 });
  aggregateQuery.push({ "$limit": Number(limit) });
  await CompaniesTasks.aggregate(aggregateQuery)
    .then((rows) => {
      return res.status(200).json({ status: "200", message: "Retrieved Reports successfully!", count: allRecords.length ? allRecords.length : 0, rows: rows ? rows : [] });
    });
}

export const exportReport = async (req, res, next) => {
  try {
    let { clientTaxonomyId, selectedCompanies, yearsList, pillarList, batchList, filteredCompanies, isSelectedAll } = req.body;
    let matchQuery = { status: true, isActive: true }, datapointFindQuery = { status: true }, datapointIds = [], dsnctTaskIds = [];
    let childAndSourceFindQuery = { status: true};
    // if (clientTaxonomyId && selectedCompanies.length > 0) {
    if (clientTaxonomyId) {
      datapointFindQuery.clientTaxonomyId = clientTaxonomyId;
      // matchQuery.companyId = { $in: selectedCompanies };
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
      } else if (pillarList.length == 0 && selectedCompanies.length > 0) {
        dsnctTaskIds = await TaskAssignment.find({
          companyId: { $in: selectedCompanies },
          taskStatus: { $ne: "Pending" },
          status: true
        }).distinct('_id')
        matchQuery.taskId = { $in: dsnctTaskIds };
      // datapointFindQuery.categoryId = { $in: dsnctTaskIds };
      }
      if (isSelectedAll && batchList && batchList.length > 0) {
        let batchIds = [];
        for (let nicIndex = 0; nicIndex < batchList.length; nicIndex++) {
          batchIds.push(batchList[nicIndex].value);
        }
        let batchCompanyDetails = await Batches.find({_id: { $in: batchIds } }).populate('companiesList');
        let batchCompanyIds = [];
        for (let batchIndex = 0; batchIndex < batchCompanyDetails.length; batchIndex++) {
          let cmpItem = batchCompanyDetails[batchIndex].companiesList;
          for (let cmpIndex = 0; cmpIndex < cmpItem.length; cmpIndex++) {
            let companyItem = cmpItem[cmpIndex];
            if(!batchCompanyIds.includes(companyItem.id)){
              batchCompanyIds.push(companyItem.id);
              // batchCompanyIds.push(mongoose.Types.ObjectId(companyItem.id));
            }
          }
        }
        let completedBatchCompanyIds = await TaskAssignment.find({companyId: { $in: batchCompanyIds }, taskStatus: { $ne: "Pending" }, status: true}).distinct('companyId');
        selectedCompanies = completedBatchCompanyIds;
      }
      if (isSelectedAll && filteredCompanies && filteredCompanies.length > 0) {
        for (let filtCmpIndex = 0; filtCmpIndex < filteredCompanies.length; filtCmpIndex++) {
          if(!selectedCompanies.includes(filteredCompanies[filtCmpIndex].value)){
            selectedCompanies.push(filteredCompanies[filtCmpIndex].value);
            // selectedCompanies.push(mongoose.Types.ObjectId(filteredCompanies[filtCmpIndex].value));
          }
        }
      }
      if (selectedCompanies.length > 0) {
        matchQuery.companyId = { $in: selectedCompanies };
        childAndSourceFindQuery.companyId = { $in: selectedCompanies };
      }
      datapointFindQuery.isRequiredForJson = true;
      datapointIds = await Datapoints.find(datapointFindQuery).distinct('_id');
      matchQuery.datapointId = { $in: datapointIds };
    } else {
      if (!clientTaxonomyId) {
        return res.status(400).json({ status: "400", message: "clientTaxonomyId is missing!", count: 0, rows: [] });
      } else {
        return res.status(400).json({ status: "400", message: "No company is selected!", count: 0, rows: [] });
      }
    }
  
    let taxonomyDetails = await ClientTaxonomy.findOne({ _id: clientTaxonomyId, status: true });
  

    // const [ allChildDpDetails, allCompanySourceDetails] = await Promise.all([
    //   ChildDp.find(childAndSourceFindQuery),
    //   CompanySources.find(childAndSourceFindQuery).populate('companyId')
    // ])
    let [allChildDpDetails, allCompanySourceDetails, allStandaloneDetails, clientTaxonomyDetail, datapointDetails] = await Promise.all([
      ChildDp.find({...childAndSourceFindQuery, isActive: true}),
      CompanySources.find(childAndSourceFindQuery).populate('companyId'),
      StandaloneDatapoints.find(matchQuery)
        .populate('companyId')
        .populate('uom')
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
      // StandaloneDatapoints.aggregate([
      //   {
      //     $lookup: {
      //       from: "taskassignments",
      //       localField: "taskId",
      //       foreignField: "_id",
      //       as: "taskDetails"
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: "datapoints",
      //       localField: "datapointId",
      //       foreignField: "_id",
      //       as: "datapointDetails"
      //     }
      //   },
      //   { $unwind: "$datapointDetails" },
      //   {
      //     $lookup: {
      //       from: "companies",
      //       localField: "companyId",
      //       foreignField: "_id",
      //       as: "companyDetails"
      //     }
      //   },
      //   { $unwind: "$companyDetails" },
      //   { $match: {...matchQuery, "taskDetails.taskStatus": { $ne: "Pending" }  } },
      //   // {
      //     // $project: {
      //     //   "companyId": "$companyId",
      //     //   "companyName": "$companyDetails.companyName",
      //     //   "cin": "$companyDetails.cin",
      //     //   "nicCode": "$companyDetails.nic",
      //     //   "nicIndustry": "$companyDetails.nicIndustry",
      //     //   "year": "$year",
      //     //   "pillar": "$categoryDetails.categoryName",
      //     //   "isChecked": { $toBool: false }
      //     // }
      //   // }
      // ]),
      ClientTaxonomy.findById(clientTaxonomyId),
      Datapoints.find({
        clientTaxonomyId: clientTaxonomyId,
        status: true,
        isRequiredForJson: true
      })
        .populate('categoryId')
        .populate('themeId')
        .populate('keyIssueId')
    ]);
    console.log('allStandaloneDetails', allStandaloneDetails.length);
  
    let masterLevelMandatoryFieldNames = ["companyName", "companyCin", "nicIndustry", "themeName", "category", "year", "keyIssueName", "description", "unit", "response", "dataType", "keyIssueName", "textSnippet", "section_of_document", "pageNumber", "sourceName", "sourceTitle", "url", "screenShot", "publicationDate", "optionalAnalystComment"]
  
    if (taxonomyDetails.taxonomyName == "Acuite") {
      let rows = [];
      for (let stdIndex = 0; stdIndex < allStandaloneDetails.length; stdIndex++) {
        let data = allStandaloneDetails[stdIndex];
        let elementObj = {
          "Item Code": "",
          "Theme Name": "",
          "Category": "",
          "CIN": "",
          "Company_Name": "",
          "year": "",
          "Description": "",
          "Expected Result": "",
          "Response": "",
          "TextSnippet": "",
          "PageNumber": "",
          "performaceResponse": "",
          "SourceName": "",
          "URL": "",
          "Screenshot": "",
          "FiscalYear": "",
          "Analyst Comment": "",
        }
        let childDpDetails = allChildDpDetails.filter((obj) =>
          obj.parentDpId == data.datapointId.id && obj.companyId == data.companyId.id && obj.year == data.year
        )
        let dpCodeDetails = datapointDetails.filter(obj => obj.id == data.datapointId['id'])
  
        let yearVal = data?.year.split('-');
  
        let dataType = '';
        if (dpCodeDetails[0].dataType == 'Number' && dpCodeDetails[0].measureType != 'Currency' && (dpCodeDetails[0].measureType != '' || dpCodeDetails[0].measureType != ' ')) {
          dataType = dpCodeDetails[0].measureType;
        } else if (dpCodeDetails[0].dataType == 'Number' && dpCodeDetails[0].measureType == 'Currency' && (dpCodeDetails[0].measureType != '' || dpCodeDetails[0].measureType != ' ')) {
          dataType = data?.placeValue ? `${data?.placeValue}" "${dpCodeDetails[0].measureType}` : "Number";
        } else {
          dataType = dpCodeDetails[0].dataType ? dpCodeDetails[0].dataType : "";
        }
  
        //Implementing for the Child DPCodes
        elementObj["Item Code"] = dpCodeDetails[0].code ? dpCodeDetails[0].code : "NI";
        elementObj["Theme Name"] = dpCodeDetails[0].themeId ? dpCodeDetails[0].themeId.themeName : "NI";
        elementObj["Category"] = dpCodeDetails[0].categoryId ? dpCodeDetails[0].categoryId.categoryName : "NI";
        elementObj["CIN"] = data.companyId ? data.companyId.cin : '';
        elementObj["Company_Name"] = data.companyId ? data.companyId.companyName : '';
        elementObj["year"] = yearVal.length > 1 ? yearVal[0].trim(' ') : 'NI';
        elementObj["Description"] = dpCodeDetails[0].description ? dpCodeDetails[0].description : "NI";
        elementObj["Expected Result"] = dpCodeDetails[0].unit ? dpCodeDetails[0].unit : "NI";
        elementObj["Response"] = data.response ? data.response : (data?.additionalDetails?.response ? data?.additionalDetails?.response : "NI");
        elementObj["TextSnippet"] = data.textSnippet ? data.textSnippet : (data?.additionalDetails?.supporting_narrative ? data?.additionalDetails?.supporting_narrative : "NI");
        elementObj["PageNumber"] = data.pageNumber ? data.pageNumber : (data?.additionalDetails?.pageNumber ? data?.additionalDetails?.pageNumber : "NI");
        elementObj["SourceName"] = data.sourceName ? data.sourceName : (data?.additionalDetails?.sourceName ? data?.additionalDetails?.sourceName : "NI");
        elementObj["URL"] = data.url ? data.url : (data?.additionalDetails?.url ? data?.additionalDetails?.url : "NI");
        elementObj["Screenshot"] = 'NI';
        elementObj["FiscalYear"] = data.publicationDate ? data.publicationDate : (data?.additionalDetails?.publicationDate ? data?.additionalDetails?.publicationDate : "NI");
        elementObj["Analyst Comment"] = data.optionalAnalystComment ? data.optionalAnalystComment : (data?.additionalDetails?.optionalAnalystComment ? data?.additionalDetails?.optionalAnalystComment : "NI");
        rows.push(elementObj);
  
        if (childDpDetails.length > 0) {
          for (let childIndex = 0; childIndex < childDpDetails.length; childIndex++) {
            const item = childDpDetails[childIndex];
            elementObj['Item Code'] = item.childFields.dpCode ? item.childFields.dpCode : "NI";
            elementObj["company_data_element_label (for numbers)"] = item.childFields.company_data_element_label ? item.childFields.company_data_element_label : " ";
            elementObj["company_data_element_sub_label (for numbers)"] = item.childFields.company_data_element_sub_label ? item.childFields.company_data_element_sub_label : " ";
            elementObj["data_value"] = item.childFields.data_value ? item.childFields.data_value : "NI";
            elementObj["data_type (number, text, units)"] = item.childFields.data_type ? item.childFields.data_type : "NI";
            elementObj["format_of_data_provided_by_company (chart, table, text)"] = item.childFields.format_of_data_provided_by_company ? item.childFields.format_of_data_provided_by_company : "NI";
            elementObj["supporting_narrative"] = item.childFields.textSnippet ? item.childFields.textSnippet : "NI";
            elementObj["section_of_document"] = item.childFields.section_of_document ? item.childFields.section_of_document : "NI";
            elementObj["page_number"] = item.childFields.pageNumber ? item.childFields.pageNumber : "NI";
            elementObj['Snapshot'] = '';
            elementObj["section_of_document"] = item.childFields.section_of_document ? item.childFields.section_of_document : "NI";
            elementObj["type of value(actual/derived/Proxy)"] = item.childFields.type_of_value ? item.childFields.type_of_value : "NI";
            rows.push(elementObj);
          }
        }
      }
      return res.status(200).json({
        status: "200",
        message: "Data exported successfully!",
        data: rows.length > 0 ? rows : []
      });
    } else {
      if (allStandaloneDetails.length > 0) {
        if (allStandaloneDetails.length > 0 && clientTaxonomyDetail && clientTaxonomyDetail.outputFields && clientTaxonomyDetail.outputFields.additionalFields.length > 0) {
          let rows = [];
          var collator = new Intl.Collator(undefined, {
            numeric: true,
            sensitivity: 'base'
          });
          // allStandaloneDetails = allStandaloneDetails.sort(function(a, b) {
          //   return collator.compare(a.datapointId.code, b.datapointId.code)
          // });
          let totalStandaloneRecords = allStandaloneDetails.length
          for (let stdIndex = 0; stdIndex < totalStandaloneRecords; stdIndex++) {  
            // console.log("allStandaloneDetails", stdIndex);
            let objectToPush = {};
            let cltTaxoDetails = clientTaxonomyDetail.outputFields.additionalFields;;
            let stdData = allStandaloneDetails[stdIndex];
            let dpDetails = datapointDetails.filter(obj => obj.id == stdData.datapointId.id )
            let sourceDetails = allCompanySourceDetails.filter(obj => obj.companyId.id == stdData.companyId.id && obj._id == stdData?.sourceName?.split(';')[1] )
            let childDpDetails = allChildDpDetails.filter((obj) =>
              obj.parentDpId == stdData?.datapointId?.id && obj?.companyId == stdData?.companyId?.id && obj?.year == stdData?.year
            )
            let yearVal = stdData?.additionalDetails?.collectionYear.split('-');
            cltTaxoDetails.push(clientTaxonomyDetail.outputFields['cin']);
            cltTaxoDetails.push(clientTaxonomyDetail.outputFields['companyName']);
            cltTaxoDetails.push(clientTaxonomyDetail.outputFields['nicIndustry']);
            cltTaxoDetails = _.sortBy(cltTaxoDetails, 'orderNumber');
            for (let outIndex = 0; outIndex < cltTaxoDetails.length; outIndex++) {
              let outputFieldsData = cltTaxoDetails[outIndex].fieldName;
              if ( outputFieldsData == 'year') {
                objectToPush[cltTaxoDetails[outIndex].displayName] = yearVal ? yearVal[0] : "";
              } else if(outputFieldsData == 'screenShot'){
                objectToPush[cltTaxoDetails[outIndex].displayName] = ""; 
              } else if(outputFieldsData == 'date_of_data_capture'){
                var date = stdData.updatedAt ? stdData.updatedAt :  "";
                let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"]
                let date_of_data_capture;
                if (date != "") {
                  date_of_data_capture = `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`
                }
                objectToPush[cltTaxoDetails[outIndex].displayName] = date_of_data_capture;
              } else if(outputFieldsData == 'publicationDate'){
                let date1 = stdData.publicationDate ? stdData.publicationDate :  "";
                let documentYear;
                if (date1 != "" && date1 != " " && date1 != '' && date1 != ' ') {
                  let date2 = date1.split('T');
                  let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"]
                  let formattedDate = date2[0].split('-');
                  let month = months[formattedDate[1]-1];
                  documentYear = `${formattedDate[2]}-${month}-${formattedDate[0]}`
                } else {
                  documentYear = "";
                }
                objectToPush[cltTaxoDetails[outIndex].displayName] = documentYear;
              } else if(outputFieldsData == 'sourceName'){
                let sourceName = sourceDetails[0]?.fileName ? sourceDetails[0]?.fileName :  "";
                objectToPush[cltTaxoDetails[outIndex].displayName] = sourceName;
              }else if(outputFieldsData == 'response'){
                let responseValue;
                if(stdData.response == 'NA' || stdData.response == "NA" || stdData.response == "Na"){
                  responseValue = "NI"
                } else {
                  responseValue = stdData.response ? stdData.response :  "";
                }
                objectToPush[cltTaxoDetails[outIndex].displayName] = responseValue;
              } else if ( stdData[outputFieldsData]) {
                objectToPush[cltTaxoDetails[outIndex].displayName] = stdData[outputFieldsData] ? stdData[outputFieldsData] : "";
              } else if (stdData.additionalDetails[outputFieldsData]) {
                objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.additionalDetails[outputFieldsData] ? stdData.additionalDetails[outputFieldsData] : "";
              } else {
                let item = cltTaxoDetails[outIndex].fieldName;
                switch (item){
                  case 'code':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.code ? dpDetails[0]?.code : "";
                    break;
                  case 'description':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.description ? dpDetails[0]?.description : "";
                    break;
                  case 'keyIssueName':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.name ? dpDetails[0]?.name : "";
                    break;
                  case 'themeName':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.themeId ? dpDetails[0]?.themeId.themeName : "";
                    break;
                  case 'category':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.categoryId ? dpDetails[0]?.categoryId.categoryName : "";
                    break;
                  case 'unit':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.unit ? dpDetails[0]?.unit : "";
                    break
                  case 'dataType':
                    let dataType = '';
                    if (dpDetails[0]?.dataType == 'Number' && (dpDetails[0]?.measureType != '' && dpDetails[0]?.measureType != ' ' && dpDetails[0]?.measureType != 'NA')) {
                      if (stdData.placeValue == 'Number') {
                        dataType =  stdData?.uom ? `${stdData?.uom?.uomName}` : "Number";                   
                      } else {
                        dataType = stdData?.placeValue ? `${stdData?.placeValue}-${stdData?.uom?.uomName}` : "Number";
                      }
                    } else if(dpDetails[0]?.dataType == 'Number' && stdData?.placeValue == 'Number' && (dpDetails[0]?.measureType == '' || dpDetails[0]?.measureType == ' ' || dpDetails[0]?.measureType == 'NA')){
                      dataType = stdData?.placeValue ? stdData?.placeValue : "Number";
                    }else{
                      dataType = "Text"
                    }
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dataType ? dataType : "";
                    break
                  case 'companyCin':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.companyId ? stdData.companyId.cin : "";
                    break;
                  case 'companyName':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.companyId ? stdData.companyId.companyName : "";
                    break;
                  case 'nicIndustry':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.companyId ? stdData.companyId.nicIndustry : "";
                    break;
                  case 'dataProvider':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0]?.additionalDetails.dataProvider ? dpDetails[0]?.additionalDetails.dataProvider : "ESGDS";
                    break;
                  case 'sourceTitle':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = sourceDetails[0]?.sourceTitle ? sourceDetails[0]?.sourceTitle : "";
                    break;
                  default:
                    objectToPush[cltTaxoDetails[outIndex].displayName] = "";
                }
              }
            }
            let objectToPushAsChildCopy = JSON.parse(JSON.stringify(objectToPush));
            // console.log(objectToPushAsChildCopy);
            await Role.count({status: true});
            
            if ((stdData.response == 'NI' || stdData.response == 'NA' || stdData.response == 'Na') && stdData.additionalDetails.didTheCompanyReport == "No") {
              let responseObjectToPush = getResponseObject(objectToPush);
              rows.push(responseObjectToPush);
            } else if ((stdData.response == 'NI' || stdData.response == 'NA') && stdData.additionalDetails.didTheCompanyReport == "Yes") {
              objectToPush['data_type (number, text, units)'] = "";
              rows.push(objectToPush);
            } else if(stdData.additionalDetails.formatOfDataProvidedByCompanyChartTableText == "Text"){
              objectToPush["company_data_element_label (for numbers)"] = "";
              objectToPush["company_data_element_sub_label (for numbers)"] = "";
              objectToPush["Total_or_sub_line_item (for numbers)"] = "";
              rows.push(objectToPush);
            } else {
              rows.push(objectToPush);
            }
            if (childDpDetails.length > 0) {
              let totalChildDpRecords = childDpDetails.length;
              for (let childIndex = 0; childIndex < totalChildDpRecords; childIndex++) {
                let objectToPushAsChild = {};
                objectToPushAsChild = JSON.parse(JSON.stringify(objectToPushAsChildCopy));
                const item = childDpDetails[childIndex];
                let dataType;
                if (dpDetails[0]?.dataType == 'Number' && (dpDetails[0]?.measureType != '' && dpDetails[0]?.measureType != ' ' && dpDetails[0]?.measureType != 'NA')) {
                  if (item.childFields?.placeValue == 'Number') {
                    dataType =  item.childFields?.uom ? `${item.childFields?.uom}` : "Number";                   
                  } else {
                    // dataType = stdData?.placeValue ? `${stdData?.placeValue}-${stdData?.uom?.uomName}` : "Number";
                    dataType = item.childFields?.placeValue ? `${item.childFields?.placeValue}-${item.childFields?.uom}` : "Number";
                  }
                } else if(dpDetails[0]?.dataType == 'Number' && item.childFields?.placeValue == 'Number' && (dpDetails[0]?.measureType == '' || dpDetails[0]?.measureType == ' ' || dpDetails[0]?.measureType == 'NA')){
                  dataType = item.childFields?.placeValue ? item.childFields?.placeValue : "Number";
                }else{
                  dataType = "Text"
                }
                let responseValue;
                if (item.childFields.response == 'NA' || item.childFields.response == "NA"  || item.childFields.response == "Na") {
                  responseValue = "NI";
                } else {
                  responseValue = item.childFields.response ? item.childFields.response : "";
                }

                let date1 = item.childFields.publicationDate ? item.childFields.publicationDate :  "";
                let documentYear;
                if (date1 != "" && date1 != " " && date1 != '' && date1 != ' ') {
                  var month1 = date1.getUTCMonth(); //months from 1-12
                  var day = date1.getUTCDate();
                  var year = date1.getUTCFullYear()
                  // let date2 = date1.split('T');
                  let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"]
                  // let formattedDate = date2[0].split('-');
                  let month = months[month1];
                  documentYear = `${day}-${month}-${year}`
                } else {
                  documentYear = "";
                }

                objectToPushAsChild['Item Code'] = item?.childFields?.dpCode ? item?.childFields?.dpCode : "";
                objectToPushAsChild["company_data_element_label (for numbers)"] = item?.childFields?.companyDataElementLabel ? item?.childFields?.companyDataElementLabel : "";
                objectToPushAsChild["company_data_element_sub_label (for numbers)"] = item?.childFields?.companyDataElementSubLabel ? item?.childFields?.companyDataElementSubLabel : "";
                objectToPushAsChild["data_value"] = responseValue;
                objectToPushAsChild["data_type (number, text, units)"] = dataType ? dataType : "";
                objectToPushAsChild["Format_of_data_provided_by_company (chart, table, text)"] = item?.childFields?.formatOfDataProvidedByCompanyChartTableText ? item?.childFields?.formatOfDataProvidedByCompanyChartTableText : "";
                objectToPushAsChild["supporting_narrative"] = item?.childFields?.textSnippet ? item?.childFields?.textSnippet : "";
                objectToPushAsChild["section_of_document"] = item?.childFields?.sectionOfDocument ? item?.childFields?.sectionOfDocument : "";
                objectToPushAsChild["page_number"] = item?.childFields?.pageNumber ? item?.childFields?.pageNumber : "";
                objectToPushAsChild['Snapshot'] = '';
                objectToPushAsChild["Keyword_used"] = item?.childFields?.keywordUsed ? item?.childFields?.keywordUsed : "";
                objectToPushAsChild["type of value(actual/derived/Proxy)"] = item?.childFields?.typeOf ? item?.childFields?.typeOf : "";
                objectToPushAsChild["Format_of_data_provided_by_company (chart, table, text)"] = item?.childFields?.formatOfDataProvidedByCompanyChartTableText ? item?.childFields?.formatOfDataProvidedByCompanyChartTableText : "";
                objectToPushAsChild["did_the_company_report"] = item?.childFields?.didTheCompanyReport ? item?.childFields?.didTheCompanyReport : "";
                objectToPushAsChild["name_of_document_as_saved"] = item?.childFields?.sourceName ? item?.childFields?.sourceName : "";
                objectToPushAsChild["name_of_document (as listed on title page)"] = item?.childFields?.sourceTitle ? item?.childFields?.sourceTitle : "";
                objectToPushAsChild["HTML Link of Document"] = item?.childFields?.url ? item?.childFields?.url : "";
                objectToPushAsChild["Document Year"] = documentYear;
                objectToPushAsChild["Comment_G"] = item?.childFields?.commentG ? item?.childFields?.commentG : "";
                objectToPushAsChild["Total_or_sub_line_item (for numbers)"] = "subline";

                if ((responseValue == 'NI' || responseValue == 'NA' || responseValue == 'Na') && item.childFields.didTheCompanyReport == "No") {
                  let responseObjectToPush = getResponseObject(objectToPushAsChild);
                  rows.push(responseObjectToPush);
                } else if ((responseValue == 'NI' || responseValue == 'NA') && item.childFields.didTheCompanyReport == "Yes") {
                  objectToPushAsChild['data_type (number, text, units)'] = "";
                  rows.push(objectToPushAsChild);
                } else if(item.childFields.formatOfDataProvidedByCompanyChartTableText == "Text"){
                  objectToPushAsChild["company_data_element_label (for numbers)"] = "";
                  objectToPushAsChild["company_data_element_sub_label (for numbers)"] = "";
                  objectToPushAsChild["Total_or_sub_line_item (for numbers)"] = "";
                  rows.push(objectToPushAsChild);
                } else {
                  rows.push(objectToPushAsChild);
                }
              }
            }
            if (stdIndex % 1000 == 0) {
              console.log("Length", stdIndex);
            }
          }
          rows.sort(function(a, b) {
            return collator.compare(a["Item Code"], b["Item Code"]) || collator.compare(a["name_of_company"], b["name_of_company"]) || collator.compare(a["year"], b["year"])
          });
          return res.status(200).json({
            status: "200",
            message: "Data exported successfully!",
            rows: rows.length,
            data: rows.length > 0 ? rows : []
          });
        } else {
          return res.status(500).json({
            status: "500",
            message: "Output fields not configured yet for this Client Taxonomy, Please configure now!",
            data: []
          });
        }
      } else {
        return res.status(500).json({
          status: "500",
          message: "No data found for the applied filter and selected companies!",
          data: []
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message ? error.message : "Failed to exports the reports!"
    })
  }
}

export function getResponseObject (responseObject) {
  responseObject['data_type (number, text, units)'] = "";
  responseObject["date_of_data_capture"] = "";
  responseObject["type of value(actual/derived/Proxy)"] = "";
  responseObject["company_data_element_label (for numbers)"] = "";
  responseObject["company_data_element_sub_label (for numbers)"] = "";
  responseObject["relevant_standards_and_frameworks"] = "";
  responseObject["Total_or_sub_line_item (for numbers)"] = "";
  responseObject["Format_of_data_provided_by_company (chart, table, text)"] = "";
  responseObject["supporting_narrative"] = "";
  responseObject["section_of_document"] = "";
  responseObject["page_number"] = "";
  responseObject["name_of_document_as_saved"] = "";
  responseObject["name_of_document (as listed on title page)"] = "";
  responseObject["HTML Link of Document"] = "";
  responseObject["Snapshot"] = "";
  responseObject["Document Year"] = "";
  responseObject["Keyword_used"] = "";
  responseObject["Additional Source Used?"] = "";

  return responseObject;
}

export const companySearch = async (req, res, next) => {
  
  const { clientTaxonomyId, nicList, batchList, companyName } = req.body;
  try {
    if (clientTaxonomyId && companyName) {
      let companyFindQuery = { clientTaxonomyId: mongoose.mongo.ObjectId(clientTaxonomyId), status: true };
      if (nicList && nicList?.length > 0) {
        let nics = [];
        for (let nicIndex = 0; nicIndex < nicList.length; nicIndex++) {
          nics.push(nicList[nicIndex].value);
        }
        companyFindQuery.nic = { $in: nics };
      }
      if (batchList && batchList?.length > 0) {
        let batchIds = [];
        for (let nicIndex = 0; nicIndex < batchList.length; nicIndex++) {
          batchIds.push(batchList[nicIndex].value);
        }
        let batchCompanyDetails = await Batches.find({_id: { $in: batchIds } }).populate('companiesList');
        let batchCompanyIds = [];
        for (let batchIndex = 0; batchIndex < batchCompanyDetails.length; batchIndex++) {
          let cmpItem = batchCompanyDetails[batchIndex].companiesList;
          for (let cmpIndex = 0; cmpIndex < cmpItem.length; cmpIndex++) {
            let companyItem = cmpItem[cmpIndex];
            if(!batchCompanyIds.includes(mongoose.mongo.ObjectId(companyItem.id))){
              batchCompanyIds.push(mongoose.mongo.ObjectId(companyItem.id));
            }
          }
        }
        companyFindQuery.$and = [
          {
            $or : [
              { companyName: { '$regex': companyName, '$options': 'i' } },
              { cin: { '$regex': companyName, '$options': 'i' } }
            ]
          },
          {
            _id: { $in: batchCompanyIds }
          }
        ]
      } else {
        companyFindQuery.$or = [
          { companyName: { '$regex': companyName, '$options': 'i' } },
          { cin: { '$regex': companyName, '$options': 'i' } }
        ];
      }
      await Companies.aggregate([{ $match: companyFindQuery }, { $limit: 10 }, 
        {
          $project: {
            "value": "$_id",
            "_id": 0,
            "label": "$companyName"
          }
        }
      ])
      .then((companies) => {
        return res.status(200).json({ status: "200", 
        message: "Retrieved matching companies successfully!", data: companies ? companies : [] });
      })
      .catch((error) => {
        return res.status(500).json({ status: "500", message: error.message ? error.message : "No Companies found!" });
      })
    } else {
      return res.status(500).json({ status: "500", message: error.message ? error.message : "No Companies found!" });
    }
  } catch (error) {
    return res.status(500).json({
      status: "500",
      message: error.message ? error.message : "No Companies found!"
    })
  }
}

export const exportQATasks = async (req, res, next) => {
  const { selectedTasks, isSelectedAll, role } = req.body;
  let exportQuery = {}, taxonomyBatchIds = [];
  let taxonomyDetail = await ClientTaxonomy.findOne({$or:[{taxonomyName: "SFDR"},{
      taxonomyName: "SFDR_V1"}], status: true });
  if (taxonomyDetail) {
    taxonomyBatchIds = await Batches.find({ clientTaxonomy: taxonomyDetail.id }).distinct('_id');
  } else {
    return res.status(400).json({ status: "400", message: "SFDR taxonomy not found!" });
  }
  if (selectedTasks && selectedTasks.length > 0 && !isSelectedAll) {
    let sfdrTaskIds = await TaskAssignment.find({
      batchId: { $in: taxonomyBatchIds },
      _id: { $in: selectedTasks },
      taskStatus: { $in: ["Collection Completed", "Correction Completed"] },
      status: true
    }).distinct('_id');
    if (sfdrTaskIds.length > 0) {
      exportQuery = {
        taskId: { $in: sfdrTaskIds },
        status: true,
        isActive: true
      }
    } else {
      return res.status(400).json({ status: "400", message: "Can export only SFDR task data!", data: [] });
    }
  } else if ((!selectedTasks || selectedTasks.length <= 0) && isSelectedAll) {
    if (role == "GroupAdmin") {
      let adminGroupIds = await Group.find({ groupAdmin: req.user.id }).distinct('_id');
      console.log('adminGroupIds', adminGroupIds);
      if (adminGroupIds.length > 0) {
        let groupTaskIds = await TaskAssignment.find({
          batchId: { $in: taxonomyBatchIds },
          groupId: { $in: adminGroupIds },
          taskStatus: { $in: ["Collection Completed", "Correction Completed"] },
          status: true
        }).distinct('_id');
        if (groupTaskIds.length > 0) {
          exportQuery = {
            taskId: { $in: groupTaskIds },
            status: true,
            isActive: true
          }
        } else {
          return res.status(400).json({ status: "400", message: "No data available to export!", data: [] });
        }
      } else {
        return res.status(400).json({ status: "400", message: "You're not an admin for any group!", data: [] });
      }
    } else if (role == "Admin" || role == "SuperAdmin") {
      let batchTaskIds = await TaskAssignment.find({
        batchId: { $in: taxonomyBatchIds },
        taskStatus: { $in: ["Collection Completed", "Correction Completed"] },
        status: true
      }).distinct('_id');
      if (batchTaskIds.length > 0) {
        exportQuery = {
          taskId: { $in: batchTaskIds },
          status: true,
          isActive: true
        }
      } else {
        exportQuery = {
          status: true,
          isActive: true
        }
      }
    } else if (role == "QA") {
      let qaTaskIds = await TaskAssignment.find({
        batchId: { $in: taxonomyBatchIds },
        qaId: req.user.id,
        taskStatus: { $in: ["Collection Completed", "Correction Completed"] },
        status: true
      }).distinct('_id');
      if (qaTaskIds.length > 0) {
        exportQuery = {
          taskId: { $in: qaTaskIds },
          status: true,
          isActive: true
        }
      } else {
        return res.status(400).json({ status: "400", message: "No records found!", data: [] });
      }
    } else {
      return res.status(400).json({ status: "400", message: "Invalid role and selected tasks to export data!", data: [] });
    }
  } else {
    return res.status(400).json({ status: "400", message: "No tasks selected to export data!", data: [] });
  }
  let distinctTaskIds = await StandaloneDatapoints.find(exportQuery).distinct('taskId');
  let allErrorDetails = await ErrorDetails.find({ taskId: { $in: distinctTaskIds }, status: true }).populate('errorTypeId').populate('datapointId').populate('companyId')
  let selectedTaskData = await TaskAssignment.find({ _id: { $in: distinctTaskIds } }).distinct('_id');
  if (selectedTaskData.length > 0) {
    StandaloneDatapoints.aggregate([
      { '$match': {
          taskId: { $in: distinctTaskIds },
          status: true,
          isActive: true
        }
      },
      { '$lookup': { from: 'taskassignments', localField: 'taskId', foreignField: '_id', as: 'taskDetails' } },
      { '$unwind': '$taskDetails' },
      { '$lookup': { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'companyDetails' } },
      { '$unwind': '$companyDetails' },
      { '$lookup': { from: 'datapoints', localField: 'datapointId', foreignField: '_id', as: 'datapointDetails' } },
      { '$unwind': '$datapointDetails' },
      { '$lookup': { from: 'categories', localField: 'taskDetails.categoryId', foreignField: '_id', as: 'categoryDetails' } },
      { '$unwind': '$categoryDetails' },
      { '$lookup': { from: 'measureuoms', localField: 'uom', foreignField: '_id', as: 'uomDetails' } },
      { '$unwind': { path: '$uomDetails', preserveNullAndEmptyArrays: true } },
      {
        '$project': {
          taskNumber: '$taskDetails.taskNumber',
          company: '$companyDetails.companyName',
          pillar: '$categoryDetails.categoryName',
          dpCode: '$datapointDetails.code',
          description: '$datapointDetails.description',
          collectionYear: '$additionalDetails.collectionYear',
          year: '$year',
          response: '$response',
          placeValue: '$placeValue',
          uom: '$uomDetails.uomName',
          didTheCompanyReport: "$additionalDetails.didTheCompanyReport",
          typeOfValueActualDerivedProxy: "$additionalDetails.typeOfValueActualDerivedProxy",
          companyDataElementLabel: "$additionalDetails.companyDataElementLabel",
          companyDataElementSubLabel: "$additionalDetails.companyDataElementSubLabel",
          totalOrSubLineItemForNumbers: "$additionalDetails.totalOrSubLineItemForNumbers",
          formatOfDataProvidedByCompanyChartTableText: "$additionalDetails.formatOfDataProvidedByCompanyChartTableText",
          textSnippet: '$textSnippet',
          sectionOfDocument: "$additionalDetails.sectionOfDocument",
          pageNumber: '$pageNumber',
          sourceName: "$sourceName",
          keywordUsed: "$additionalDetails.keywordUsed",
          commentG: "$additionalDetails.commentG",
          hasError: '',
          errorType: '',
          errorComments: '',
          additionalSourceUsed: '$additionalDetails.additionalSourceUsed?',
          _id: '$_id',
          taskId: '$taskDetails._id',
          companyId: '$companyId',
          pillarId: '$categoryDetails._id',
          dpCodeId: '$datapointDetails._id'
        }
      }
    ])
      .then((standaloneData) => {
        for (let index = 0; index < standaloneData.length; index++) {
          const element = standaloneData[index];
          let errorDpDetails = allErrorDetails.filter((obj) => 
          obj?.datapointId?.code == element?.dpCode && obj?.companyId?.companyName == element?.company && obj?.year == element?.year
          )
          if (errorDpDetails.length > 0) {
            standaloneData[index].hasError = true;
            standaloneData[index].errorType = errorDpDetails[0]?.errorTypeId ? errorDpDetails[0]?.errorTypeId?.errorType : "";
            standaloneData[index].errorComments = errorDpDetails[0]?.comments ? errorDpDetails[0]?.comments?.content : "";
          }
        }
        const distinctTaskIdList = distinctTaskIds.map(x => x.toString());
        ChildDp.aggregate([
          {
            $match: {
              taskId: { $in: distinctTaskIdList },
              status: true,
              isActive: true
            }
          },
          {
            $addFields: {
              convertedTaskId: { $toObjectId: "$taskId" },
              convertedDatapointId: { $toObjectId: "$parentDpId" }
            }
          },
          { '$lookup': { from: 'taskassignments', localField: 'convertedTaskId', foreignField: '_id', as: 'taskDetails' } },
          { '$unwind': '$taskDetails' },
          { '$lookup': { from: 'companies', localField: 'taskDetails.companyId', foreignField: '_id', as: 'companyDetails' } },
          { '$unwind': '$companyDetails' },
          { '$lookup': { from: 'categories', localField: 'taskDetails.categoryId', foreignField: '_id', as: 'categoryDetails' } },
          { '$unwind': '$categoryDetails' },
          {
            '$project': {
              taskNumber: '$taskDetails.taskNumber',
              company: '$companyDetails.companyName',
              pillar: '$categoryDetails.categoryName',
              dpCode: '$childFields.dpCode',
              year: '$year',
              response: '$childFields.response',
              placeValue: '$childFields.placeValue',
              uom: '$childFields.uom',
              didTheCompanyReport: "$childFields.didTheCompanyReport",
              typeOfValueActualDerivedProxy: "$childFields.typeOfValueActualDerivedProxy",
              companyDataElementLabel: "$childFields.companyDataElementLabel",
              companyDataElementSubLabel: "$childFields.companyDataElementSubLabel",
              formatOfDataProvidedByCompanyChartTableText: "$childFields.formatOfDataProvidedByCompanyChartTableText",
              textSnippet: '$childFields.textSnippet',
              sectionOfDocument: "$childFields.sectionOfDocument",
              pageNumber: '$childFields.pageNumber',
              keywordUsed: "$childFields.keywordUsed",
              commentG: "$childFields.commentG",
              hasError: '',
              errorType: '',
              errorComments: '',
              _id: '$_id',
              taskId: '$taskId',
              companyId: '$companyId',
              pillarId: '$categoryDetails._id',
              dpCodeId: '$parentDpId',
            }
          }
        ])
          .then((childData) => {
            let responseData = _.concat(standaloneData, childData);
            responseData = _.sortBy(responseData, 'dpCode')
            responseData = _.sortBy(responseData, 'company')
            // var collator = new Intl.Collator(undefined, {
            //   numeric: true,
            //   sensitivity: 'base'
            // });
            // responseData.sort(function(a, b) {
            //   return collator.compare(a["dpCode"], b["dpCode"]) && collator.compare(a["company"], b["company"])
            // });

            return res.status(200).json({ status: "200", message: "Data exported successfully!", data: responseData });
          })
      })
      .catch((error) => {
        return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to export!", data: [] });
      })
  } else {
    return res.status(400).json({ status: "400", message: "No records found!", data: [] });
  }
}




// export const exportQATasks = async (req, res, next) => {
//   const { selectedTasks, isSelectedAll, role } = req.body;
//   let exportQuery = {};
//   if (selectedTasks && selectedTasks.length > 0) {
//     selectedTasks = selectedTasks.map(s => mongoose.Types.ObjectId(s));
//     exportQuery = {
//       taskId: { $in: selectedTasks },
//       status: true,
//       isActive: true
//     }
//   } else if ((!selectedTasks || selectedTasks.length <= 0) && isSelectedAll) {
//     if (role == "GroupAdmin") {
//       let adminGroupIds = await Group.find({ groupAdmin: req.user.id }).distinct('_id');
//       console.log('adminGroupIds', adminGroupIds);
//       if (adminGroupIds.length > 0) {
//         exportQuery = {
//           "taskDetails.groupId": { $in: adminGroupIds },
//           status: true,
//           isActive: true
//         }
//       } else {
//         return res.status(400).json({ status: "400", message: "You're not an admin for any group!", count: 0, rows: [] });
//       }
//     } else if (role == "Admin" || role == "SuperAdmin") {
//       exportQuery = {
//         status: true,
//         isActive: true
//       }
//     } else if (role == "QA") {
//       exportQuery = {
//         "taskDetails.qaId": mongoose.Types.ObjectId(req.user.id),
//         status: true,
//         isActive: true
//       }
//     } else {
//       return res.status(400).json({ status: "400", message: "Invalid role and selected tasks to export data!", count: 0, rows: [] });
//     }
//   } else {
//     return res.status(400).json({ status: "400", message: "No tasks selected to export data!", count: 0, rows: [] });
//   }
//   console.log('exportQuery', exportQuery);
//   await StandaloneDatapoints.aggregate([
//     {
//       $match: { 
//         ...exportQuery,
//         //"companyDetails.clientTaxonomyId": mongoose.Types.ObjectId("621ef39ce3170b2420a227d7"),
//         //"taskDetails.taskStatus": { $in: [ "Collection Completed", "Correction Completed" ] }
//       }
//     },
//     {
//         $lookup: {
//             from: "taskassignments",
//             localField: "taskId",
//             foreignField: "_id",
//             as: "taskDetails"
//         }
//     },
//     { $unwind: "$taskDetails" },
//     {
//         $lookup: {
//             from: "companies",
//             localField: "companyId",
//             foreignField: "_id",
//             as: "companyDetails"
//         }
//     },
//     { $unwind: "$companyDetails" },
//     {
//         $lookup: {
//             from: "datapoints",
//             localField: "datapointId",
//             foreignField: "_id",
//             as: "datapointDetails"
//         }
//     },
//     { $unwind: "$datapointDetails" },
//     {
//         $project: {
//             "_id": "$_id",
//             "taskId": "$taskDetails._id",
//             "taskNumber": "$taskDetails.taskNumber",
//             "companyId": "$companyId",
//             "company": "$companyDetails.companyName",
//             "dpCodeId": "$datapointDetails._id",
//             "dpCode": "$datapointDetails.code",
//             "year": "$year",
//             "response": "$response",
//             "hasError": { $toBool: false },
//             "errorType": "",
//             "errorComments": ""
//         }
//     }
//     ])
//     .then((exportData) => {
//       console.log('exportData', exportData);
//       return res.status(200).json({ status: "200", data: exportData, message: "Data exported successfully!" });
//     });
// }