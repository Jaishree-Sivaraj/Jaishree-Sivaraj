import XLSX from 'xlsx'
import _ from 'lodash'
import moment from 'moment'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Companies } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Companies.create({ ...body, createdBy: user })
    .then((companies) => companies.view(true))
    .then(success(res, 201))
    .catch(next)

export const createCompanyMembers = ({ user, bodymen: { body } }, res, next) => {
  if (body.me) {

  }
  Companies.updateOne({ ...body, createdBy: user })
    .then((companies) => companies.view(true))
    .then(success(res, 201))
    .catch(next)
}

export const index = ({ querymen: { query, select, cursor } }, res, next) => {
  Companies.count(query)
    .then(count => Companies.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy')
      .populate('clientTaxonomyId')
      .then((companies) => {
        let companiesList = [];
        for (let cmpIndex = 0; cmpIndex < companies.length; cmpIndex++) {
          companies[cmpIndex]['companyName'] = companies[cmpIndex]['companyName'] + ' - ' + companies[cmpIndex]['clientTaxonomyId']['taxonomyName'];
          companiesList.push(companies[cmpIndex])
        }
        return res.status(200).json({ status: "200", message: "Retrieved companies successfully!", data: companiesList });
      })
    )
    .catch((error) => {
      return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to retrieve companies!" });
    })
}

export const getAllUnAssignedCompanies = ({ querymen: { query, select, cursor }, params }, res, next) => {
  Companies.count({ isAssignedToBatch: false, clientTaxonomyId: params.clientTaxonomyId })
    .then(count => Companies.find({ isAssignedToBatch: false, clientTaxonomyId: params.clientTaxonomyId })
      .sort({ createdAt: -1 })
      .populate('createdBy')
      .populate('clientTaxonomyId')
      .then((companies) => ({
        count,
        rows: companies.map((companies) => companies.view())
      }))
    )
    .then(success(res))
    .catch(next)
}

export const getAllNic = ({ querymen: { query, select, cursor } }, res, next) =>
  Companies.distinct('nic')
    .populate('createdBy')
    .populate('clientTaxonomyId')
    .then((companies) => ({
      rows: companies
    })
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Companies.findById(params.id)
    .populate('createdBy')
    .populate('clientTaxonomyId')
    .then(notFound(res))
    .then((companies) => companies ? companies.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Companies.findById(params.id)
    .populate('createdBy')
    .populate('clientTaxonomyId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companies) => companies ? Object.assign(companies, body).save() : null)
    .then((companies) => companies ? companies.view(true) : null)
    .then(success(res))
    .catch(next)

export const addCompanyMember = async ({ user, bodymen: { body }, params }, res, next) => {
  if (body.companyId) {
    await Companies.findById(body.companyId).populate('createdBy')
    .populate('clientTaxonomyId')
      .then(async (companyObject) => {
        if (companyObject) {
          if (body.years && body.years.length > 0) {
            console.log('body.years', body.years);
            for (let index = 0; index < body.years.length; index++) {
              console.log('index', body.years[index]);
              let memberObject = {
                name: body.name ? body.name : 'NA',
                year: body.years[index],
                memberType: body.memberType
              }
              await Companies.updateOne({ _id: companyObject.id }, { $push: { companyMemberDetails: memberObject } });
            }
          } else {
            return res.status(400).json({ status: "400", message: "No year details present for the member!" })
          }
        } else {
          return res.status(400).json({ status: "400", message: "Company not found!" })
        }
      })
      .catch((error) => {
        return res.status(400).json({ status: "400", message: error.message ? error.message : "Company not found!" })
      })
    return res.status(200).json({ status: "200", message: "Member added to company successfully!" })
  } else {
    return res.status(400).json({ status: "400", message: "Some fields are missing in the payload!" })
  }
}

export const updateCompanyMember = async ({ user, bodymen: { body }, params }, res, next) => {
  if (body.companyId) {
    await Companies.findById(body.companyId).populate('createdBy')
    .populate('clientTaxonomyId')
      .then(async (companyObject) => {
        if (companyObject) {
          await Companies.updateOne({ _id: companyObject.id }, { $set: { companyMemberDetails: body.companyMemberDetails } })
            .then((updateResponse) => {
              return res.status(200).json({ status: "200", message: "Member details updated successfully!" })
            })
            .catch((error) => {
              return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to update members!" })
            });
        } else {
          return res.status(400).json({ status: "400", message: "Company not found!" })
        }
      })
      .catch((error) => {
        return res.status(400).json({ status: "400", message: error.message ? error.message : "Company not found!" })
      })
  } else {
    return res.status(400).json({ status: "400", message: "Some fields are missing in the payload!" })
  }
}

export const destroy = ({ user, params }, res, next) =>
  Companies.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companies) => companies ? companies.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const uploadCompaniesFile = async (req, res, next) => {
  try {
    const userDetail = req.user;
    let convertedWorkbook, companyInfo = [];
    convertedWorkbook = XLSX.read(req.body.companiesFile.replace(/^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/, ""));
    if (convertedWorkbook.SheetNames.length > 0) {
      var worksheet = convertedWorkbook.Sheets[convertedWorkbook.SheetNames[0]];
      try {
        var sheetAsJson = XLSX.utils.sheet_to_json(worksheet, { defval: " " });
        if (sheetAsJson.length > 0) {
          for (let index1 = 0; index1 < sheetAsJson.length; index1++) {
            const rowObject = sheetAsJson[index1];
            rowObject['NIC Code'] = String(rowObject['NIC Code']);
            let companyObject = {
              companyName: rowObject['Company Name'],
              cin: rowObject['CIN'],
              nicCode: rowObject['NIC Code'],
              nic: rowObject['NIC Code'].toString().substring(0, 2),
              nicIndustry: rowObject['NIC industry'],
              isinCode: rowObject['ISIN Code'],
              cmieProwessCode: rowObject['CMIE/Prowess Code'],
              clientTaxonomyId: req.body.clientTaxonomyId,
              fiscalYearEndDate: rowObject['Fiscal Year End Date'] ? rowObject['Fiscal Year End Date'] : '',
              fiscalYearEndMonth: rowObject['Fiscal Year End Month'] ? rowObject['Fiscal Year End Month'] : '',
              isAssignedToBatch: false,
              status: true,
              createdBy: userDetail
            }
            companyInfo.push(companyObject);
          }
          if (companyInfo.length > 0) {
            let companyHeaders = [ "Company Name", "CIN", "NIC Code", "NIC industry", "ISIN Code", "CMIE/Prowess Code", "Fiscal Year End Date", "Fiscal Year End Month" ]
            if (companyHeaders && companyHeaders.length > 0 && Object.keys(companyInfo[0]).length > 0) {
              let inputFileHeaders = Object.keys(sheetAsJson[0]);
              let missingHeaders = _.difference(companyHeaders, inputFileHeaders);
              if (missingHeaders.length > 0) {
                return res.status(400).json({ status: "400", message: missingHeaders.join() + " fields are required but missing in the uploaded file!" });
              } else {
                for (let cmpIndex = 0; cmpIndex < companyInfo.length; cmpIndex++) {
                  let endDate = companyInfo[cmpIndex].fiscalYearEndDate;
                  let endMonth = companyInfo[cmpIndex].fiscalYearEndMonth;
                  let currentYear = new Date().getFullYear();
                  let parsedDate = Date.parse(`${currentYear}-${endMonth}-${endDate}`);
                  if (parsedDate && parsedDate != "NaN") {
                    let isValidDate = moment(`${endMonth}/${endDate}/${currentYear}`, 'MM/DD/YY').isValid();
                    let keyNames = Object.keys(sheetAsJson[cmpIndex]);
                    for (let hIndex = 0; hIndex < keyNames.length; hIndex++) {
                      if (!sheetAsJson[cmpIndex][keyNames[hIndex]] || sheetAsJson[cmpIndex][keyNames[hIndex]] == '' || sheetAsJson[cmpIndex][keyNames[hIndex]] == ' ' || sheetAsJson[cmpIndex][keyNames[hIndex]] == null) {
                        return res.status(400).json({ status: "400", message: "Found empty value for " + keyNames[hIndex]});
                      }
                    }
                    if (!isValidDate) {
                      return res.status(400).json({ status: "400", message: "Invalid date value for Fiscal Year End Date " + companyInfo[cmpIndex].fiscalYearEndDate + " and Fiscal Year End Month " + companyInfo[cmpIndex].fiscalYearEndMonth });
                    }                      
                  } else {
                    return res.status(400).json({ status: "400", message: "Invalid date value for Fiscal Year End Date " + companyInfo[cmpIndex].fiscalYearEndDate + " and Fiscal Year End Month " + companyInfo[cmpIndex].fiscalYearEndMonth });
                  }
                }
              }
            }
            for (let index = 0; index < companyInfo.length; index++) {
              await Companies.updateOne({ cin: companyInfo[index].cin }, { $set: companyInfo[index] }, { upsert: true })
                .catch((error) => {
                  return res.status(400).json({
                    status: "400",
                    message: error.message ? error.message : "Failed to update company of CIN-" + companyInfo[index].cin + " for company-" + companyInfo[index].companyName
                  })
                });
            }
          }
          return res.status(200).json({ status: "200", message: "File Upload Successful", data: companyInfo });
        } else {
          return res.status(400).json({ status: "400", message: "No values present in the uploaded file, please check!" })
        }
      } catch (error) {
        return res.status(400).json({ message: error.message })
      }
    } else {
      return res.status(400).json({ status: "400", message: "Invalid excel file please check!" })
    }
  } catch (error) {
    if (error) {
      return res.status(403).json({
        message: error.message ? error.message : 'Failed to upload companies file',
        status: 403
      });
    }
  }
}