import mongoose, { Schema } from 'mongoose'
import { Companies } from "../companies";
import { CompaniesTasks } from "../companies_tasks";
import { StandaloneDatapoints } from "../standalone_datapoints";
import { ClientTaxonomy } from "../clientTaxonomy";
import _ from 'lodash'
import { Datapoints } from '../datapoints'
import { ChildDp } from '../child-dp'
import { CompanySources } from '../companySources'

export const create = ({ body }, res, next) =>
  res.status(201).json(body)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  res.status(200).json([])

export const reportsFilter = async (req, res, next) => {
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
    if (searchQuery != '') {
      companyFindQuery.companyName = { "$regex": searchQuery, "$options": "i" };
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
    { $match: {...matchQuery, "taskDetails.taskStatus": { $in: ["Verification Completed", "Completed"] } } },
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
        datapointFindQuery.isRequiredForJson = true;
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
  
    let taxonomyDetails = await ClientTaxonomy.find({ _id: clientTaxonomyId, status: true });
  
  
    const [ allChildDpDetails, allCompanySourceDetails] = await Promise.all([
      ChildDp.find({ status: true, isActive: true, companyId: {$in: selectedCompanies} }),
      CompanySources.find({ status: true, companyId: {$in: selectedCompanies} }).populate('companyId')
    ])
    let [allStandaloneDetails, clientTaxonomyDetail, datapointDetails] = await Promise.all([
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
      ClientTaxonomy.findById(clientTaxonomyId),
      Datapoints.find({
        clientTaxonomyId: clientTaxonomyId,
        status: true,
        // isRequiredForJSON: true
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
  
        let Year = data.year.split('-',);
  
        let dataType = '';
        if (dpCodeDetails[0].dataType == 'Number' && dpCodeDetails[0].measureType != 'Currency' && (dpCodeDetails[0].measureType != '' || dpCodeDetails[0].measureType != ' ')) {
          dataType = dpCodeDetails[0].measureType;
        } else if (dpCodeDetails[0].dataType == 'Number' && dpCodeDetails[0].measureType == 'Currency' && (dpCodeDetails[0].measureType != '' || dpCodeDetails[0].measureType != ' ')) {
          dataType = data?.placeValue ? `${data?.placeValue}" "${dpCodeDetails[0].measureType}` : "Number";
        } else {
          dataType = dpCodeDetails[0].dataType ? dpCodeDetails[0].dataType : "NI";
        }
  
        //Implementing for the Child DPCodes
        elementObj["Item Code"] = dpCodeDetails[0].code ? dpCodeDetails[0].code : "NI";
        elementObj["Theme Name"] = dpCodeDetails[0].themeId ? dpCodeDetails[0].themeId.themeName : "NI";
        elementObj["Category"] = dpCodeDetails[0].categoryId ? dpCodeDetails[0].categoryId.categoryName : "NI";
        elementObj["CIN"] = data.companyId ? data.companyId.cin : '';
        elementObj["Company_Name"] = data.companyId ? data.companyId.companyName : '';
        elementObj["year"] = Year.length > 1 ? Year[0].trim(' ') : 'NI';
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
          allStandaloneDetails = _.sortBy(allStandaloneDetails, 'companyId.id')
          for (let stdIndex = 0; stdIndex < allStandaloneDetails.length; stdIndex++) {
            let objectToPush = {}, objectToPushAsChild = {};
            let cltTaxoDetails = clientTaxonomyDetail.outputFields.additionalFields;;
            let stdData = allStandaloneDetails[stdIndex];
            let dpDetails = datapointDetails.filter(obj => obj.id == stdData.datapointId.id )
            let sourceDetails = allCompanySourceDetails.filter(obj => obj.companyId.id == stdData.companyId.id && obj.sourceUrl == stdData.url )
            let childDpDetails = allChildDpDetails.filter((obj) =>
              obj.parentDpId == stdData.datapointId.id && obj.companyId == stdData.companyId.id && obj.year == stdData.year
            )
            let Year = stdData.year.split('-',);
            cltTaxoDetails.push(clientTaxonomyDetail.outputFields['cin']);
            cltTaxoDetails.push(clientTaxonomyDetail.outputFields['companyName']);
            cltTaxoDetails.push(clientTaxonomyDetail.outputFields['nicIndustry']);
            cltTaxoDetails = _.sortBy(cltTaxoDetails, 'orderNumber');
            for (let outIndex = 0; outIndex < cltTaxoDetails.length; outIndex++) {
              let outputFieldsData = cltTaxoDetails[outIndex].fieldName;
              if ( outputFieldsData == 'year') {
                objectToPush[cltTaxoDetails[outIndex].displayName] = Year ? Year[0] : "NI";
              } else if(outputFieldsData == 'screenShot'){
                objectToPush[cltTaxoDetails[outIndex].displayName] = ""; 
              } else if(outputFieldsData == 'date_of_data_capture'){
                var date = stdData.updatedAt ? stdData.updatedAt :  "NI";
                let months = ["01","02","03","04","05","06","07","08","09","10","11","12"]
                let date_of_data_capture;
                if (date != "NI") {
                  date_of_data_capture = `${months[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`
                }
                objectToPush[cltTaxoDetails[outIndex].displayName] = date_of_data_capture;
              } else if(outputFieldsData == 'publicationDate'){
                let date1 = stdData.publicationDate ? stdData.publicationDate :  "NI";
                let documentYear;
                if (date1 != "NI") {
                  let date2 = date1.split('T');
                  let formattedDate = date2[0].split('-');
                  documentYear = `${formattedDate[1]}-${formattedDate[2]}-${formattedDate[0]}`
                }
                objectToPush[cltTaxoDetails[outIndex].displayName] = documentYear;
              }else if(outputFieldsData == 'response'){
                let responseValue;
                if(stdData.response == 'NA' || stdData.response == "NA"){
                  responseValue = "NI"
                } else {
                  responseValue = stdData.response ? stdData.response :  "NI";
                }
                objectToPush[cltTaxoDetails[outIndex].displayName] = responseValue;
              } else if ( stdData[outputFieldsData]) {
                objectToPush[cltTaxoDetails[outIndex].displayName] = stdData[outputFieldsData] ? stdData[outputFieldsData] : "NI";
              } else if (stdData.additionalDetails[outputFieldsData]) {
                objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.additionalDetails[outputFieldsData] ? stdData.additionalDetails[outputFieldsData] : "NI";
              } else {
                let item = cltTaxoDetails[outIndex].fieldName;
                switch (item){
                  case 'code':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].code ? dpDetails[0].code : "NI";
                    break;
                  case 'description':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].description ? dpDetails[0].description : "NI";
                    break;
                  case 'keyIssueName':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].keyIssueId ? dpDetails[0].keyIssueId.keyIssueName : "NI";
                    break;
                  case 'themeName':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].themeId ? dpDetails[0].themeId.themeName : "NI";
                    break;
                  case 'category':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].categoryId ? dpDetails[0].categoryId.categoryName : "NI";
                    break;
                  case 'unit':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].unit ? dpDetails[0].unit : "NI";
                    break
                  case 'dataType':
                    let dataType = '';
                    if (dpDetails[0].dataType == 'Number' && dpDetails[0].measureType != 'Currency' && (dpDetails[0].measureType != '' || dpDetails[0].measureType != ' ')) {
                      dataType = stdData?.placeValue ? `${stdData?.placeValue}-${stdData?.uom?.uomName}` : "Number";
                    } else if (dpDetails[0].dataType == 'Number' && dpDetails[0].measureType == 'Currency' && (dpDetails[0].measureType != '' || dpDetails[0].measureType != ' ')) {
                      dataType = stdData?.placeValue ? `${stdData?.placeValue}-${stdData?.uom?.uomName}` : "Number";
                    } else if(dpDetails[0].dataType == 'Number' && (dpDetails[0].measureType == '' || dpDetails[0].measureType == ' ')){
                      dataType = "Number";
                    }else{
                      dataType = "Text"
                    }
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dataType ? dataType : "NI";
                    break
                  case 'companyCin':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.companyId ? stdData.companyId.cin : "NI";
                    break;
                  case 'companyName':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.companyId ? stdData.companyId.companyName : "NI";
                    break;
                  case 'nicIndustry':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = stdData.companyId ? stdData.companyId.nicIndustry : "NI";
                    break;
                  case 'dataProvider':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = dpDetails[0].dataProvider ? dpDetails[0].dataProvider : "ESGDS";
                    break;
                  case 'sourceTitle':
                    objectToPush[cltTaxoDetails[outIndex].displayName] = sourceDetails[0]?.sourceTitle ? sourceDetails[0]?.sourceTitle : "NI";
                    break;
                  default:
                    objectToPush[cltTaxoDetails[outIndex].displayName] = "NI";
                }
              }
            }
            rows.push(objectToPush);
            if (childDpDetails.length > 0) {
              for (let childIndex = 0; childIndex < childDpDetails.length; childIndex++) {
                objectToPushAsChild = JSON.parse(JSON.stringify(objectToPush));
                const item = childDpDetails[childIndex];
                let dataType;
                if (dpDetails[0].dataType == 'Number' && dpDetails[0].measureType != 'Currency' && (dpDetails[0].measureType != '' || dpDetails[0].measureType != ' ')) {
                  dataType = item.childFields?.placeValue ? `${item.childFields?.placeValue}-${item.childFields?.uom}` : "Number";
                } else if (dpDetails[0].dataType == 'Number' && dpDetails[0].measureType == 'Currency' && (dpDetails[0].measureType != '' || dpDetails[0].measureType != ' ')) {
                  dataType = item.childFields?.placeValue ? `${item.childFields?.placeValue}-${item.childFields?.uom}` : "Number";
                } else if(dpDetails[0].dataType == 'Number' && (dpDetails[0].measureType == '' || dpDetails[0].measureType == ' ')){
                  dataType = "Number";
                }else{
                  dataType = "Text"
                }
                let responseValue;
                if (item.childFields.response == 'NA' || item.childFields.response == "NA") {
                  responseValue = "NI";
                } else {
                  responseValue = item.childFields.response ? item.childFields.response : "NI";
                }
                objectToPushAsChild['Item Code'] = item.childFields.dpCode ? item.childFields.dpCode : "NI";
                objectToPushAsChild["company_data_element_label (for numbers)"] = item.childFields.companyDataElementLabel ? item.childFields.companyDataElementLabel : "NI";
                objectToPushAsChild["company_data_element_sub_label (for numbers)"] = item.childFields.companyDataElementSubLabel ? item.childFields.companyDataElementSubLabel : "NI";
                objectToPushAsChild["data_value"] = responseValue;
                objectToPushAsChild["data_type (number, text, units)"] = dataType ? dataType : "NI";
                objectToPushAsChild["format_of_data_provided_by_company (chart, table, text)"] = item.childFields.formatOfDataProvidedByCompanyChartTableText ? item.childFields.formatOfDataProvidedByCompanyChartTableText : "NI";
                objectToPushAsChild["supporting_narrative"] = item.childFields.textSnippet ? item.childFields.textSnippet : "NI";
                objectToPushAsChild["section_of_document"] = item.childFields.sectionOfDocument ? item.childFields.sectionOfDocument : "NI";
                objectToPushAsChild["page_number"] = item.childFields.pageNumber ? item.childFields.pageNumber : "NI";
                objectToPushAsChild['Snapshot'] = '';
                objectToPushAsChild["type of value(actual/derived/Proxy)"] = item.childFields.typeOf ? item.childFields.typeOf : "NI";
                rows.push(objectToPushAsChild);
              }
            }
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
