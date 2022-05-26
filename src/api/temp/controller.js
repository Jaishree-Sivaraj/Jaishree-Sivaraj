import { TaskAssignment } from '../taskAssignment';
import { Companies } from '../companies';
import { getSortedYear } from '../datapoints/dp-details-functions';
import { StandaloneDatapoints } from '../standalone_datapoints';
import { Datapoints } from '../datapoints';
import { User } from '../user';

export const create = ({ body }, res, next) =>
  res.status(201).json(body)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  res.status(200).json([])

export const show = ({ params }, res, next) =>
  res.status(200).json({})

export const update = ({ body, params }, res, next) =>
  res.status(200).json(body)

export const destroy = ({ params }, res, next) =>
  res.status(204).end()

export const updateCorrectionPending = async (req, res, next) => {
  if (req.params.taskStatus && req.params.taskStatus != "" && req.params.taskStatus != " " && req.params.clientTaxonomyId && req.params.clientTaxonomyId != "") {
    let taxonomyCompanyIds = await Companies.find({ clientTaxonomyId: req.params.clientTaxonomyId, status: true }).distinct('_id');
    if (taxonomyCompanyIds.length > 0) {
      let tasksList = await TaskAssignment.find({ companyId: { $in: taxonomyCompanyIds }, taskStatus: req.params.taskStatus, status: true }).populate('categoryId');
      if (tasksList.length > 0) {
        let taskListLength = tasksList.length;
        for (let index = 0; index < taskListLength; index++) {
          let [standAloneDetailsForThisTask, taskDatapoints] = await Promise.all([
            StandaloneDatapoints.find({ taskId: tasksList[index]?.id, status: true, isActive: true }).populate('datapointId'),
            Datapoints.find({ clientTaxonomyId: req.params.clientTaxonomyId, categoryId: tasksList[index].categoryId, dataCollection: 'Yes', status: true })
          ])
          let taskYears = tasksList[index]?.year ? tasksList[index]?.year : "";
          if (taskYears !== "") {
            let taskYearsList = taskYears.split(', ');
            let qualitativeYear = getSortedYear(taskYears.split(', '));
            console.log('qualitativeYear', qualitativeYear);
            if (taskYearsList.length > 0) {
              for (let tYIndex = 0; tYIndex < taskYearsList.length; tYIndex++) {
                let yearData = taskYearsList[tYIndex];
                for (let dpIndex = 0; dpIndex < taskDatapoints.length; dpIndex++) {
                  let dpData = taskDatapoints[dpIndex];
                  let dpYearData = standAloneDetailsForThisTask.filter(obj => obj.year == yearData && obj.datapointId.id == dpData.id);
                  if (dpYearData.length == 0) {
                    //If data is missing
                    if (req.params.clientTaxonomyId == "621ef39ce3170b2420a227d7") {
                      if ((yearData == qualitativeYear[0] && dpData.dataType !== "Number") || (dpData.dataType == "Number")) {
                        let lastInactiveData = await StandaloneDatapoints.findOne({
                          taskId: tasksList[index]?.id,
                          year: yearData,
                          datapointId: dpData.id,
                          "$or": [{ status: false, isActive: true }, { status: true, isActive: false }]
                        }).sort({ updatedAt: -1 });
                        if (lastInactiveData) {
                          console.log('Case 2');
                          await StandaloneDatapoints.updateOne({ _id: lastInactiveData._id }, {
                            $set: {
                              status: true,
                              isActive: true
                            }
                          })
                        }
                      }
                    } else {
                      let lastInactiveData = await StandaloneDatapoints.findOne({
                        taskId: tasksList[index]?.id,
                        year: yearData,
                        datapointId: dpData.id,
                        "$or": [{ status: false, isActive: true }, { status: true, isActive: false }]
                      }).sort({ updatedAt: -1 });
                      if (lastInactiveData) {
                        await StandaloneDatapoints.updateOne({ _id: lastInactiveData._id }, {
                          $set: {
                            status: true,
                            isActive: true
                          }
                        })
                      }
                    }
                  }
                }
              }
            } else {
              return res.json({ status: "400", message: "No task years available!" });
            }
          } else {
            return res.json({ status: "400", message: "Invalid Task Years" });
          }
          if (index == taskListLength - 1) {
            return res.json({ status: "200", message: "Values updated successfully!" })
          }
        }
      } else {
        return res.json({ status: "400", message: "No Tasks available in " + req.params.taskStatus + " status!" });
      }
    } else {
      return res.json({ status: "400", message: "No Companies found the clientTaxonomyId!" });
    }
  }
}


export const updateName = async (req, res, next) => {
  try {
    const userData = await User.find({ name: '' });

    userData.map(async user => {
      let name = user?.email?.split('@')[0];
      if (name.includes('.')) {
        const fullName = name.split('.');
        name = fullName[0].toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) { return c.toUpperCase() }) + ' ' + fullName[1].toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) { return c.toUpperCase() });
      }
      const updateData = await User.findOneAndUpdate({ _id: user?._id },
        {
          name
        }, {
        new: true
      })
      console.log(updateData);
    }

    )
    return res.json({ message: 'Done' });


  } catch (error) {

  }
}