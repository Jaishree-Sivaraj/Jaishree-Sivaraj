import { success, notFound, authorOrAdmin } from '../../services/response/'
import { TaskAssignment } from '.'

export const create = async({ user, bodymen: { body } }, res, next) => {
  await TaskAssignment.findOne({ status: true }).sort({ createdAt: -1 }).limit(1)
  .then(async(taskObject) => {
    console.log('taskObject', taskObject);
    let newTaskNumber = '';
    if (taskObject) {
      if (taskObject.taskNumber) {
        let lastTaskNumber = taskObject.taskNumber.split('DT')[1];
        newTaskNumber = Number(lastTaskNumber)+1;
      } else {
        newTaskNumber = '1';
      }
      body.taskNumber = 'DT' + newTaskNumber;
      await TaskAssignment.create({ ...body, createdBy: user })
        .then((taskAssignment) => { 
          return res.status(200).json({ status: "200", message: "Task created successfully!", data: taskAssignment.view(true) });
        })
        .catch((error) => {
          return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to create task!" });
        })      
    } else {
      if (taskObject.taskNumber) {
        let lastTaskNumber = taskObject.taskNumber.split('DT')[1];
        newTaskNumber = Number(lastTaskNumber)+1;
      } else {
        newTaskNumber = '1';
      }
      body.taskNumber = 'DT' + newTaskNumber;
      await TaskAssignment.create({ ...body, createdBy: user })
        .then((taskAssignment) => { 
          return res.status(200).json({ status: "200", message: "Task created successfully!", data: taskAssignment.view(true) });
        })
        .catch((error) => {
          return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to create task!" });
        })
    }
  })
  .catch((error) => {
    return res.status(400).json({ status: "400", message: error.message ? error.message : "Failed to create task!" })
  });
}

export const index = ({ querymen: { query, select, cursor } }, res, next) => {
  TaskAssignment.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then((taskAssignments) => {
      let taskList = [];
      for (let index = 0; index < taskAssignments.length; index++) {
        const object = taskAssignments[index];
        let taskObject = {
          taskId: object.taskNumber,
          pillar: object.categoryId ? object.categoryId.categoryName : null,
          pillarId: object.categoryId ? object.categoryId.id : null,
          batch: object.batchId ? object.batchId.batchName : null,
          batchId: object.batchId ? object.batchId.id : null,
          company: object.companyId ? object.companyId.companyName : null,
          companyId: object.companyId ? object.companyId.id : null,
          analyst: object.analystId ? object.analystId.name : null,
          analystId: object.analystId ? object.analystId.id : null,
          qa: object.qaId ? object.qaId.name : null,
          qaId: object.qaId ? object.qaId.id : null,
          fiscalYear: object.year,
          taskStatus: object.taskStatus,
          createdBy: object.createdBy ? object.createdBy.name : null,
          createdById: object.createdBy ? object.createdBy.id : null,
        };
        taskList.push(taskObject);
      }
      return res.status(200).json({ status: "200", message: "Tasks retrieved successfully!", data: {
          count: taskList.length,
          rows: taskList
        }
      })
    })
    .catch((error) => {
      return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
    })
}

export const getMyTasks = ({ user, querymen: { query, select, cursor } }, res, next) => {
  console.log('get my tasks');
  let findQuery = { status: true, $or: [{ analystId: user.id }, { qaId: user.id }] };
  TaskAssignment.find(findQuery)
    .sort({ createdAt: -1 })
    .populate('createdBy')
    .populate('companyId')
    .populate('categoryId')
    .populate('batchId')
    .populate('analystId')
    .populate('qaId')
    .then((taskAssignments) => {
      let taskList = [];
      for (let index = 0; index < taskAssignments.length; index++) {
        const object = taskAssignments[index];
        let taskObject = {
          taskId: object.taskNumber,
          pillar: object.categoryId ? object.categoryId.categoryName : null,
          pillarId: object.categoryId ? object.categoryId.id : null,
          batch: object.batchId ? object.batchId.batchName : null,
          batchId: object.batchId ? object.batchId.id : null,
          company: object.companyId ? object.companyId.companyName : null,
          companyId: object.companyId ? object.companyId.id : null,
          analyst: object.analystId ? object.analystId.name : null,
          analystId: object.analystId ? object.analystId.id : null,
          qa: object.qaId ? object.qaId.name : null,
          qaId: object.qaId ? object.qaId.id : null,
          fiscalYear: object.year,
          taskStatus: object.taskStatus,
          createdBy: object.createdBy ? object.createdBy.name : null,
          createdById: object.createdBy ? object.createdBy.id : null,
        };
        taskList.push(taskObject);
      }
      return res.status(200).json({ status: "200", message: "Tasks retrieved successfully!", data: {
          count: taskList.length,
          rows: taskList
        }
      })
    })
    .catch((error) => {
      return res.status(400).json({ status: "400", message: error.message ? error.message : 'Failed to retrieve tasks!' });
    })
}

export const show = ({ params }, res, next) =>
  TaskAssignment.findById(params.id)
      .populate('createdBy')
      .populate('companyId')
      .populate('categoryId')
      .populate('batchId')
      .populate('analystId')
      .populate('qaId')
    .then(notFound(res))
    .then((taskAssignment) => taskAssignment ? taskAssignment.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  TaskAssignment.findById(params.id)
      .populate('createdBy')
      .populate('companyId')
      .populate('categoryId')
      .populate('batchId')
      .populate('analystId')
      .populate('qaId')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taskAssignment) => taskAssignment ? Object.assign(taskAssignment, body).save() : null)
    .then((taskAssignment) => taskAssignment ? taskAssignment.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  TaskAssignment.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'createdBy'))
    .then((taskAssignment) => taskAssignment ? taskAssignment.remove() : null)
    .then(success(res, 204))
    .catch(next)
