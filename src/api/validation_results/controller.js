import { success, notFound, authorOrAdmin } from '../../services/response/'
import { ValidationResults } from '.'
import { KeyIssues } from '../key_issues'
import _ from 'lodash'

export const create = ({ bodymen: { body } }, res, next) =>
  ValidationResults.create({ ...body })
    .then((validationResults) => validationResults.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ValidationResults.count(query)
    .then(count => ValidationResults.find(query, select, cursor)
      .then((validationResults) => ({
        count,
        rows: validationResults.map((validationResults) => validationResults.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const retrieveValidationResults = async(req, res, next) => {
  const { taskId, dpType, keyIssueId, memberId, memberName, categoryId, page, limit } = req.body;
  let keyIssueFindQuery = { status: true }, resultQuery = { taskId: taskId, status: true };
  if (!page || !limit) {
    return res.status(500).json({
      status: 500,
      message: 'Limit and Page Missing'
    });
  }
  if (categoryId) {
    keyIssueFindQuery.categoryId = categoryId;
    resultQuery.pillarId = categoryId;
  }
  if (keyIssueId) {
    resultQuery.pillarId = keyIssueId;
  }
  if (dpType != '' && dpType != 'Standalone') {
    if (memberId) {
      resultQuery.memberId = memberId;
    }
    if (memberName) {
      resultQuery.memberName = memberName;
    }
  }
  const [ keyIssueList, results, memberList ] = await Promise.all([
    KeyIssues.aggregate([
      { $match: keyIssueFindQuery }, { $project: { _id: 0, value: "$_id", label: "$keyIssueName" } }]),
    ValidationResults.find(resultQuery).skip((page - 1) * limit)
    .limit(+limit)
    .sort({ dpCode: 1 }),
    ValidationResults.aggregate([
      {
        $match: { 
          taskId: taskId, 
          memberId: { $ne: '' }, 
          memberName: { $ne: '' }, 
          memberType: { $ne: 'Standalone' }, 
          status: true 
        }
      },
      {
        $project: {
          _id: 0,
          value: "$memberId", 
          label: "$memberName", 
          year: "$fiscalYear"
        }
      }
    ])
  ]);

  let data = {
    keyIssueList,
    datapointList : {
      dpCodesData: results,
      memberList: memberList.length > 0 ? _.uniqBy(memberList, 'memberId') : []
    }
  }
  return res.status(200).json({ status: "200", data, message: "Retrieved validation results successfully!" });
}

export const show = ({ params }, res, next) =>
  ValidationResults.findById(params.id)
    .then(notFound(res))
    .then((validationResults) => validationResults ? validationResults.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  ValidationResults.findById(params.id)
    .then(notFound(res))
    .then((validationResults) => validationResults ? Object.assign(validationResults, body).save() : null)
    .then((validationResults) => validationResults ? validationResults.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  ValidationResults.findById(params.id)
    .then(notFound(res))
    .then((validationResults) => validationResults ? validationResults.remove() : null)
    .then(success(res, 204))
    .catch(next)
