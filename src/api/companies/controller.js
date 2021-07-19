import XLSX from 'xlsx'
import _ from 'lodash'
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
      .populate('createdBy')
      .then((companies) => ({
        count,
        rows: companies.map((companies) => companies.view())
      }))
    )
    .then(success(res))
    .catch(next)
}

export const getAllUnAssignedCompanies = ({ querymen: { query, select, cursor } }, res, next) => {
  Companies.count({ isAssignedToBatch: false })
    .then(count => Companies.find({ isAssignedToBatch: false })
      .populate('createdBy')
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
    .then((companies) => ({
      rows: companies
    })
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  Companies.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then((companies) => companies ? companies.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Companies.findById(params.id)
    .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companies) => companies ? Object.assign(companies, body).save() : null)
    .then((companies) => companies ? companies.view(true) : null)
    .then(success(res))
    .catch(next)

export const addCompanyMember = async ({ user, bodymen: { body }, params }, res, next) => {
  if (body.companyId) {
    await Companies.findById(body.companyId).populate('createdBy')
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
            let companyObject = {
              companyName: rowObject['Company Name'].replace(/[\\r\\n]/g,''),
              cin: rowObject['CIN'].replace(/[\\n\\r]/g, ''),
              nicCode: rowObject['NIC Code'].replace(/[\\r\\n]/g,''),
              nic: rowObject['NIC Code'].toString().substring(0, 2),
              nicIndustry: rowObject['NIC industry'].replace(/[\\r\\n]/g,''),
              isinCode: rowObject['ISIN Code'].replace(/[\\r\\n]/g,''),
              cmieProwessCode: rowObject['CMIE/Prowess Code'],
              socialAnalystName: rowObject['Analyst Name'].replace(/[\\r\\n]/g,''),
              socialQAName: rowObject['QA Name'].replace(/[\\r\\n]/g,''),
              clientTaxonomyId: req.body.clientTaxonomyId,
              // socialAnalystName: rowObject['Analyst Name'].replace(/[\\r\\n]/g,''),
              // socialQAName: rowObject['QA Name'].replace(/[\\r\\n]/g,''),
              status: true,
              createdBy: userDetail
            }
            companyInfo.push(companyObject);
            if (companyInfo.length > 0) {
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