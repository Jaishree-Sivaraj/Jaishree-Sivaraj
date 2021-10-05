import * as fs from 'fs'
import _ from 'lodash'
import { success, notFound, authorOrAdmin } from '../../services/response/'
import { CompaniesTasks } from '.'
import { Companies } from '../companies'
import { ClientTaxonomy } from '../clientTaxonomy'
import { Categories } from '../categories'
import { Group } from '../group'
import { Batches } from '../batches'
import { User } from '../user'
import { TaskAssignment } from '../taskAssignment'
import { TaskHistories } from '../task_histories'
import { StandaloneDatapoints } from '../standalone_datapoints'
import { BoardMembersMatrixDataPoints  } from '../boardMembersMatrixDataPoints'
import { KmpMatrixDataPoints } from '../kmpMatrixDataPoints'
import { DerivedDatapoints } from '../derived_datapoints'
import { Datapoints } from '../datapoints'

export const create = ({ user, bodymen: { body } }, res, next) =>
  CompaniesTasks.create({ ...body, createdBy: user })
    .then((companiesTasks) => companiesTasks.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  CompaniesTasks.count(query)
    .then(count => CompaniesTasks.find(query, select, cursor)
    .populate('taskId')
    .populate('companyId')
    .populate('categoryId')
    .populate('createdBy')
      .then((companiesTasks) => ({
        count,
        rows: companiesTasks.map((companiesTasks) => companiesTasks.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  CompaniesTasks.findById(params.id)
  .populate('taskId')
  .populate('companyId')
  .populate('categoryId')
  .populate('createdBy')
    .then(notFound(res))
    .then((companiesTasks) => companiesTasks ? companiesTasks.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  CompaniesTasks.findById(params.id)
  .populate('taskId')
  .populate('companyId')
  .populate('categoryId')
  .populate('createdBy')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companiesTasks) => companiesTasks ? Object.assign(companiesTasks, body).save() : null)
    .then((companiesTasks) => companiesTasks ? companiesTasks.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  CompaniesTasks.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((companiesTasks) => companiesTasks ? companiesTasks.remove() : null)
    .then(success(res, 204))
    .catch(next)

    export const allocateTasksFromJson = async({ user, params }, res, next) => {
      try {
        fs.readFile(__dirname + '/task_allocation.json', async (err, data) => {
          if (err) throw err;
          let allTaskList = JSON.parse(data);
          let clientTaxonomyDetail = await ClientTaxonomy.findOne({ taxonomyName: "Acuite", status: true });
          let allExistingCompanies =  await Companies.find({ clientTaxonomyId : clientTaxonomyDetail.id, status: true }).populate('companyId');
          let allExistingCategories =  await Categories.find({ clientTaxonomyId : clientTaxonomyDetail.id, status: true });
          let allExistingGroups =  await Group.find({ status: true });
          let allExistingEmployees =  await User.find({ 
            userType : "Employee", 
            isUserActive : true,
            isUserApproved : true,
            isUserRejected : false,
            isRoleAssigned : true, 
            status: true });
          let yearsList = _.uniqBy(allTaskList, 'BatchYears');
          let distinctYears = [];
          for (let yearsListIndex = 0; yearsListIndex < yearsList.length; yearsListIndex++) {
            let years = yearsList[yearsListIndex].BatchYears.split(',');
            for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
              distinctYears.push(years[yearIndex]);
            }
          }
          for (let taskListIndex = 0; taskListIndex < allTaskList.length; taskListIndex++) {
            let companyDetail = allExistingCompanies.find(obj =>  obj.cin == allTaskList[taskListIndex]['CIN']  );
            let categoryDetail = allExistingCategories.find(obj => obj.categoryName == allTaskList[taskListIndex]['Pillar']);
            let groupDetail = allExistingGroups.find(obj => obj.groupName == allTaskList[taskListIndex]['Group']);
            let analystDetail = allExistingEmployees.find(obj => obj.email == allTaskList[taskListIndex]['Analyst']);
            let qaDetail = allExistingEmployees.find(obj => obj.email == allTaskList[taskListIndex]['QA']);
            if(companyDetail && companyDetail.id){
              allTaskList[taskListIndex]['taskNumber'] = `DT${taskListIndex+1}`;
              allTaskList[taskListIndex]['taskStatus'] = "Completed";
              allTaskList[taskListIndex]['overAllCompanyTaskStatus'] = true;
              allTaskList[taskListIndex]['status'] = true;
              allTaskList[taskListIndex]['categoryId'] = categoryDetail.id;
              allTaskList[taskListIndex]['groupId'] = groupDetail.id;
              allTaskList[taskListIndex]['batchId'] = "";
              allTaskList[taskListIndex]['year'] = allTaskList[taskListIndex]['BatchYears'];
              allTaskList[taskListIndex]['analystSLADate'] = allTaskList[taskListIndex]['AnalystSLADate'];
              allTaskList[taskListIndex]['qaSLADate'] = allTaskList[taskListIndex]['QaSLADate'];
              allTaskList[taskListIndex]['analystId'] = analystDetail.id;
              allTaskList[taskListIndex]['qaId'] = qaDetail.id;
              allTaskList[taskListIndex]['createdBy'] = user.id;
              allTaskList[taskListIndex]['companyId'] = companyDetail.id;
              allTaskList[taskListIndex]['clientTaxonomyId'] = clientTaxonomyDetail.id;
              allTaskList[taskListIndex]['createdAt'] = new Date();
              allTaskList[taskListIndex]['updatedAt'] = new Date();
            }
          }
          const uniqCompanies = _.uniqBy(allTaskList, 'companyId');
          const uniqBatches = _.uniqBy(allTaskList, 'Batch');
          const uniqGroups = _.uniqBy(allTaskList, 'groupId');
          for (let batchIndex = 0; batchIndex < uniqBatches.length; batchIndex++) {
            let years = uniqBatches[batchIndex]['BatchYears'].split(',');
            let batchObject = {
              "years" : years ? years : [],
              "companiesList" : [],
              "status" : true,
              "isAssignedToGroup" : true,
              "batchName" : uniqBatches[batchIndex]['Batch'],
              "clientTaxonomy" : clientTaxonomyDetail.id,
              "createdBy" : user.id,
              "createdAt" : new Date(),
              "updatedAt" : new Date()
            }
            let batchCompaniesTasks = allTaskList.filter(obj => obj['Batch'] == uniqBatches[batchIndex]['Batch'])
            let batchCompanies = _.uniqBy(batchCompaniesTasks, 'companyId');
            for (let index = 0; index < batchCompanies.length; index++) {
              batchObject.companiesList.push(batchCompanies[index].companyId);        
            }
            await Batches.create(batchObject)
            .then(async(batchDtl) => {
              allTaskList.map((obj) => {
                if (obj.Batch == batchDtl.batchName) {
                  obj.batchId = batchDtl.id;
                }
              })
              await Group.updateOne({ "_id": uniqBatches[batchIndex]['groupId'] }, { $push: { batchList: batchDtl.id } })
            })
          }
          for (let taskAssignmentIndex = 0; taskAssignmentIndex < allTaskList.length; taskAssignmentIndex++) {
            const taskObjectToInsert = allTaskList[taskAssignmentIndex];
            await TaskAssignment.create(taskObjectToInsert)
            .then(async(taskDtl) => {
              let taskDetail = await TaskAssignment.findById(taskDtl.id).populate('analystId').populate('qaId');
              for (let historyIndex = 0; historyIndex < 4; historyIndex++) {
                let historyObject = {
                  taskId: taskDtl.id, 
                  companyId: taskObjectToInsert.companyId, 
                  categoryId: taskObjectToInsert.categoryId, 
                  submittedByName: '', 
                  stage: '', 
                  comment: '', 
                  status: true, 
                  createdBy: user.id
                }
                if (historyIndex == 0) {
                  historyObject.stage = 'Assigned';
                  historyObject.createdAt = taskDtl.analystSLADate;
                  historyObject.updatedAt = taskDtl.analystSLADate;
                  historyObject.submittedByName = taskDetail.analystId.name;
                } else if(historyIndex == 1){
                  historyObject.stage = 'Collection Completed';
                  historyObject.createdAt = taskDtl.analystSLADate;
                  historyObject.updatedAt = taskDtl.analystSLADate;
                  historyObject.submittedByName = taskDetail.analystId.name;
                } else if(historyIndex == 2){
                  historyObject.stage = 'Verification Completed';
                  historyObject.createdAt = taskDtl.qaSLADate;
                  historyObject.updatedAt = taskDtl.qaSLADate;
                  historyObject.submittedByName = taskDetail.qaId.name;
                } else if(historyIndex == 3){
                  historyObject.stage = 'Completed';
                  historyObject.createdAt = taskDtl.qaSLADate;
                  historyObject.updatedAt = taskDtl.qaSLADate;
                  historyObject.submittedByName = taskDetail.qaId.name;
                }
                if ( historyIndex > 1) {
                  if (taskObjectToInsert.year != "2020-2021") {
                    await TaskHistories.create(historyObject);    
                  }
                }
                await TaskHistories.create(historyObject);
              }
              let years = taskDtl.year.split(',');
              for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
                let companiesTaskObject = {
                  taskId: taskDtl.id,
                  companyId: taskDtl.companyId,
                  year: years[yearIndex],
                  categoryId: taskDtl.categoryId,
                  overAllCompanyTaskStatus: true,
                  completedDate: taskDtl.qaSLADate,
                  canGenerateJson: false,
                  isJsonGenerated: true,
                  status: true,
                  createdBy: user.id, 
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
                await CompaniesTasks.create(companiesTaskObject)
                .then(async(companyTaskDtl) => {
                  await StandaloneDatapoints.updateMany({
                    companyId: companyTaskDtl.companyId, 
                    year: companyTaskDtl.year, 
                    isActive: true,
                    status: true}, 
                    { $set: { taskId: companyTaskDtl.taskId } });
                  await BoardMembersMatrixDataPoints.updateMany({
                    companyId: companyTaskDtl.companyId, 
                    year: companyTaskDtl.year, 
                    isActive: true,
                    status: true}, 
                    { $set: { taskId: companyTaskDtl.taskId } });
                  await KmpMatrixDataPoints.updateMany({
                    companyId: companyTaskDtl.companyId, 
                    year: companyTaskDtl.year, 
                    isActive: true,
                    status: true}, 
                    { $set: {
                        taskId: companyTaskDtl.taskId
                      }
                  });
                  await DerivedDatapoints.updateMany({
                    companyId: companyTaskDtl.companyId, 
                    year: companyTaskDtl.year, 
                    status: true}, 
                    { $set: {
                        taskId: companyTaskDtl.taskId
                      }
                  });
                });
              }
            })
          }
        }); 
      } catch (error) {
        return res.status(500).json({ status: "500", message: error.message ? error.message : "Failed to allocate task!" })
      }
    }


export const taskIdMappingCorrection = async({ user, params }, res, next) => {
  let categoriesList = await Categories.find({ status: true }).distinct('_id');
  console.log('categoriesList', categoriesList);
  console.log('total categoriesList', categoriesList.length);
  for (let categoryIndex = 0; categoryIndex < categoriesList.length; categoryIndex++) {
    console.log('categoryId=', categoriesList[categoryIndex]);
    let pillarCollectionDatapointIds = await Datapoints.find({ 
      categoryId: categoriesList[categoryIndex], 
      dataCollection: "Yes", 
      functionId: { $ne: "609bcceb1d64cd01eeda092c" }, 
      status: true }).distinct('_id');
    console.log('total pillarCollectionDatapointIds', pillarCollectionDatapointIds.length);
    let pillarDerivedDatapointIds = await Datapoints.find({ 
      categoryId: categoriesList[categoryIndex], 
      dataCollection: "No", 
      functionId: { $ne: "609bcceb1d64cd01eeda092c" }, 
      status: true }).distinct('_id');
    console.log('total pillarDerivedDatapointIds', pillarDerivedDatapointIds.length);
    let taskYears = [ "2018-2019,2019-2020", "2020-2021" ];
    console.log('taskYears', taskYears.length);
    for (let taskYearIndex = 0; taskYearIndex < taskYears.length; taskYearIndex++) {
      let pillarYearTaskList = await TaskAssignment.find({ categoryId: categoriesList[categoryIndex], year: taskYears[taskYearIndex] }).populate('companyId').populate('categoryId');
      console.log('total task for '+ categoriesList[categoryIndex] + ' and year ' + taskYears[taskYearIndex] + ' is '+ pillarYearTaskList.length);
      for (let pytIndex = 0; pytIndex < pillarYearTaskList.length; pytIndex++) {
        let dataYears = [];
        if (taskYears[taskYearIndex] == "2018-2019,2019-2020") {
          dataYears = ["2018-2019", "2019-2020"];
        } else {
          dataYears = ["2020-2021"];
        }
        console.log('total dataYears', dataYears.length);
        for (let dyIndex = 0; dyIndex < dataYears.length; dyIndex++) {
          let stdCount = await StandaloneDatapoints.updateMany({ 
            companyId: pillarYearTaskList[pytIndex].companyId.id,
            datapointId: { $in: pillarCollectionDatapointIds },
            year: dataYears[dyIndex],
            isActive: true,
            status: true
          }, {
            $set: { taskId: pillarYearTaskList.id }
          })
          let bmCount = await BoardMembersMatrixDataPoints.updateMany({ 
            companyId: pillarYearTaskList[pytIndex].companyId.id,
            datapointId: { $in: pillarCollectionDatapointIds },
            year: dataYears[dyIndex],
            isActive: true,
            status: true
          }, {
            $set: { taskId: pillarYearTaskList.id }
          })
          let kmpCount = await KmpMatrixDataPoints.updateMany({ 
            companyId: pillarYearTaskList[pytIndex].companyId.id,
            datapointId: { $in: pillarCollectionDatapointIds },
            year: dataYears[dyIndex],
            isActive: true,
            status: true
          }, {
            $set: { taskId: pillarYearTaskList.id }
          })
          let derivedCount = await DerivedDatapoints.updateMany({ 
            companyId: pillarYearTaskList[pytIndex].companyId.id,
            datapointId: { $in: pillarDerivedDatapointIds },
            year: dataYears[dyIndex],
            status: true
          }, {
            $set: { taskId: pillarYearTaskList.id }
          })
          console.log('stdCount=', stdCount, 'bmCount=', bmCount, 'kmpCount=', kmpCount, 'derivedCount=', derivedCount);
        }
      }
    }
  }
  return res.status(200).json({ status: "200", message: "Mapping correction done!" });
}