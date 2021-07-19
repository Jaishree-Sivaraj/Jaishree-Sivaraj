import { success, notFound } from '../../services/response/'
import { Companies } from '../companies'
import { User } from '../user'
import { ControversyTasks } from '.'

export const create = ({ bodymen: { body } }, res, next) =>
  ControversyTasks.create(body)
    .then((controversyTasks) => controversyTasks.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  ControversyTasks.count(query)
    .then(count => ControversyTasks.find(query, select, cursor)
      .then((controversyTasks) => ({
        count,
        rows: controversyTasks.map((controversyTasks) => controversyTasks.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  ControversyTasks.findById(params.id)
    .then(notFound(res))
    .then((controversyTasks) => controversyTasks ? controversyTasks.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  ControversyTasks.findById(params.id)
    .then(notFound(res))
    .then((controversyTasks) => controversyTasks ? Object.assign(controversyTasks, body).save() : null)
    .then((controversyTasks) => controversyTasks ? controversyTasks.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  ControversyTasks.findById(params.id)
    .then(notFound(res))
    .then((controversyTasks) => controversyTasks ? controversyTasks.remove() : null)
    .then(success(res, 204))
    .catch(next)

export const controversyTask = async ({ body }, res, next) => {
  await ControversyTasks.findOne({ status: true }).sort({ createdAt: -1 }).limit(1)
    .then(async (taskObject) => {
      let controversyTaskDetails = [], newTaskNumber, taskNumber;
      if (taskObject) {
        let lastTaskNumber = taskObject.tasknumber.split('DT')[1];
        newTaskNumber = Number(lastTaskNumber) + 1;
      } else {
        newTaskNumber = 1;
      }
      for (let index = 0; index <= body.companiesList.length; index++) {
        taskNumber = 'DT' + newTaskNumber;
        let controversyObject = {
          tasknumber: taskNumber,
          companyId: body.companiesList[index],
          analystId: body.analystId,
          taskStatus: 'Yet to Work',
          status: true
        }
        controversyTaskDetails.push(controversyObject);
        newTaskNumber = newTaskNumber + 1;
        await ControversyTasks.create(controversyObject)
          .then((ControversyTasks) => ControversyTasks.view(true))
          .then(success(res, 201))
      }
      res.status(200).json({ status: (200), message: 'controversy task created success', data: controversyTaskDetails });
    })
}