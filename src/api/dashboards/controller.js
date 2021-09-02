import _ from 'lodash'
import { TaskAssignment } from '../taskAssignment'
import { User } from '../user'
import { Role } from '../role'
import { TaskSlaLog } from '../taskSlaLog'
import { ErrorDetails } from '../errorDetails'
import { Group } from '../group'

export const dashboardStats = async ({user, req}, res, next) => {
  try {
    let completeUserDetail = await User.findOne({
      _id: user.id,
      isUserActive: true
    }) .populate({ path: "roleDetails.roles" }) .populate({ path: "roleDetails.primaryRole" })
    .catch((error) => {
      return res.status(500).json({
        status: "500",
        message: error.message,
      });
    });
    let userRoles = [];
    if (completeUserDetail && completeUserDetail.roleDetails) {
      if (completeUserDetail.roleDetails.primaryRole) {
        userRoles.push(completeUserDetail.roleDetails.primaryRole.roleName);
        if ( completeUserDetail.roleDetails.roles && completeUserDetail.roleDetails.roles.length > 0 ) {
          for ( let index = 0; index < completeUserDetail.roleDetails.roles.length; index++ ) {
            if (completeUserDetail.roleDetails.roles[index]) {
              userRoles.push(completeUserDetail.roleDetails.roles[index].roleName);
            }
          }
        }
      } else {
        return res.status(400).json({
          status: "400",
          message: "User role not found!",
        });
      }
    } else {
      return res.status(400).json({
        status: "400",
        message: "User role not found!",
      });
    }
    let finalResponseObject = {
      superAdminStats: [
        {
          title: 'Tasks',
          data: [{ label: 'Pending', value: '' }, { label: 'Submitted', value: '' }],
        },
        {
          title: 'Errors',
          data: [{ label: 'Internal Errors', value: '' }, { label: 'External Errors-Client Representatives', value: '' }, { label: 'External Errors-Client Representatives(Accepted)', value: '' }, { label: "External Errors-Company Representatives", value: '' }, { label: "External Errors-Company Representatives(Accepted)", value: '' }],
        },
        {
          title: 'SLA',
          data: [{ label: 'Breaches(Analyst)', value: '' }, { label: 'Breaches(QA)', value: '' }, { label: 'Change requests(Analyst)', value: '' }, { label: 'Change requests(QA)', value: '' }],
        },
        {
          title: 'Employees',
          data: [{ label: 'Analysts', value: '' }, { label: 'QA', value: '' }, { label: 'Group Admin', value: '' }, { label: 'Admin', value: '' }, { label: 'Company Representatives', value: '' }, { label: 'Client Representatives', value: '' }, { label: 'Idle employees', value: '' }],
        }
      ],
      groupAdminStats: [
        {
          title: 'Tasks',
          data: [{ label: 'Pending', value: '' }, { label: 'Submitted', value: '' }],
        },
        {
          title: 'Errors',
          data: [{ label: 'Internal Errors', value: '' }, { label: 'External Errors(Clients)', value: '' }, { label: 'External Errors accepted(Clients)', value: '' }, { label: "External Errors(Company Representatives)", value: '' }, { label: "External Errors accepted(Company Representatives)", value: '' }],
        },
        {
          title: 'SLA',
          data: [{ label: 'Breaches(Analyst)', value: '' }, { label: 'Breaches(QA)', value: '' }, { label: 'Change requests(Analyst)', value: '' }, { label: 'Change requests(QA)', value: '' }],
        },
        {
          title: 'Employees',
          data: [{ label: 'Analysts', value: '' }, { label: 'QA', value: '' }, { label: 'Company Representatives', value: '' }, { label: 'Client Representatives', value: '' }, { label: 'Idle employees', value: '' }],
        }
      ],
      analystStats: [
        {
          title: 'Tasks',
          data: [{ label: 'Pending', value: '' }, { label: 'Submitted', value: '' }],
        },
        {
          title: 'Errors',
          data: [{ label: 'Internal Errors', value: '' }, { label: 'External Errors', value: '' }],
        },
        {
          title: 'SLA',
          data: [{ label: 'Breaches', value: '' }, { label: 'Change requests', value: '' }],
        }
      ],
      qaStats: [
        {
          title: 'Tasks',
          data: [{ label: 'Pending', value: '' }, { label: 'Submitted', value: '' }],
        },
        {
          title: 'Errors',
          data: [{ label: 'Internal Errors', value: '' }, { label: 'External Errors', value: '' }],
        },
        {
          title: 'SLA',
          data: [{ label: 'Breaches', value: '' }, { label: 'Change requests', value: '' }],
        }
      ]
    }
    let allRoles = await Role.find({status: true});
    let analystRoleId = allRoles.find(obj => obj.roleName == "Analyst");
    let qaRoleId = allRoles.find(obj => obj.roleName == "QA");
    let adminRoleId = allRoles.find(obj => obj.roleName == "Admin");
    let groupAdminRoleId = allRoles.find(obj => obj.roleName == "GroupAdmin");
    let clientRepRoleId = allRoles.find(obj => obj.roleName == "Client Representative");
    let companyRepRoleId = allRoles.find(obj => obj.roleName == "Company Representative");
    userRoles = _.uniq(userRoles);
    if (userRoles.length > 0) {
      for (let roleIndex = 0; roleIndex < userRoles.length; roleIndex++) {
        let findQuery = {};
        if (userRoles[roleIndex] == "Admin" || userRoles[roleIndex] == "SuperAdmin") {
          findQuery = { status: true };
          finalResponseObject.superAdminStats[0].data[0].value = await TaskAssignment.count({ taskStatus: 'Completed', status: true});
          finalResponseObject.superAdminStats[0].data[1].value = await TaskAssignment.count({ taskStatus: { $ne: 'Completed'}, status: true});
          finalResponseObject.superAdminStats[1].data[0].value = await ErrorDetails.count({ raisedBy: 'QA', status: true });
          finalResponseObject.superAdminStats[1].data[1].value = await ErrorDetails.count({ raisedBy: 'Client Representative', status: true });
          finalResponseObject.superAdminStats[1].data[2].value = await ErrorDetails.count({ raisedBy: 'Company Representative', status: true });
          finalResponseObject.superAdminStats[1].data[3].value = await ErrorDetails.count({ raisedBy: 'Client Representative', isAccepted: true, status: true });
          finalResponseObject.superAdminStats[1].data[4].value = await ErrorDetails.count({ raisedBy: 'Company Representative', isAccepted: true, status: true});
          finalResponseObject.superAdminStats[2].data[0].value = await TaskSlaLog.count({ requestedBy: "Analyst", isAccepted: true, status: true });
          finalResponseObject.superAdminStats[2].data[1].value = await TaskSlaLog.count({ requestedBy: "QA", isAccepted: true, status: true });
          finalResponseObject.superAdminStats[2].data[2].value = await TaskSlaLog.count({ requestedBy: "Analyst", status: true });
          finalResponseObject.superAdminStats[2].data[3].value = await TaskSlaLog.count({ requestedBy: "QA", status: true });
          finalResponseObject.superAdminStats[3].data[0].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": analystRoleId.id } }, { "roleDetails.primaryRole": analystRoleId.id }]});
          finalResponseObject.superAdminStats[3].data[1].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": qaRoleId.id } }, { "roleDetails.primaryRole": qaRoleId.id }]});
          finalResponseObject.superAdminStats[3].data[2].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": adminRoleId.id } }, { "roleDetails.primaryRole": adminRoleId.id }]});
          finalResponseObject.superAdminStats[3].data[3].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": groupAdminRoleId.id } }, { "roleDetails.primaryRole": groupAdminRoleId.id }]});
          finalResponseObject.superAdminStats[3].data[4].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": clientRepRoleId.id } }, { "roleDetails.primaryRole": clientRepRoleId.id }]});
          finalResponseObject.superAdminStats[3].data[5].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": companyRepRoleId.id } }, { "roleDetails.primaryRole": companyRepRoleId.id }]});
          finalResponseObject.superAdminStats[3].data[6].value = await User.count({ isUserActive: true, isAssignedToGroup: false, isRoleAssigned: false, status: true });
        } else if (userRoles[roleIndex] == "GroupAdmin") {
          let groupIds = await Group.find({groupAdmin: user.id, status: true}).distinct('id');
          findQuery = {
            groupId: { $in: groupIds },
            status: true
          };
          let groupMemberIds = [];
          await Group.find({"_id": { $in: groupIds }, status: true}).populate('assignedMembers')
          .then((groups) => {
            for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
              if (groups[groupIndex].assignedMembers && groups[groupIndex].assignedMembers.length > 0) {
                for (let memberIndex = 0; memberIndex < groups[groupIndex].assignedMembers.length; memberIndex++) {
                  groupMemberIds.push(groups[groupIndex].assignedMembers[memberIndex].id);                
                }
              }
            }
          });
          let taskIds = await TaskAssignment.find({ groupId: { $in: groupIds }, status: true }).distinct('id');
          finalResponseObject.groupAdminStats[0].data[0].value = await TaskAssignment.count({ groupId: { $in: groupIds }, taskStatus: 'Completed', status: true});
          finalResponseObject.groupAdminStats[0].data[1].value = await TaskAssignment.count({ groupId: { $in: groupIds }, taskStatus: { $ne: 'Completed'}, status: true});
          finalResponseObject.groupAdminStats[1].data[0].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy:'QA', status: true });
          finalResponseObject.groupAdminStats[1].data[1].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: 'Client Representative', status: true });
          finalResponseObject.groupAdminStats[1].data[2].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: 'Company Representative', status: true });
          finalResponseObject.groupAdminStats[1].data[3].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: 'Client Representative', isAccepted: true, status: true });
          finalResponseObject.groupAdminStats[1].data[4].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: 'Company Representative', isAccepted: true, status: true});
          finalResponseObject.groupAdminStats[2].data[0].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, requestedBy: "Analyst", isAccepted: true, status: true });
          finalResponseObject.groupAdminStats[2].data[1].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, requestedBy: "QA", isAccepted: true, status: true });
          finalResponseObject.groupAdminStats[2].data[2].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, requestedBy: "Analyst", status: true });
          finalResponseObject.groupAdminStats[2].data[3].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, requestedBy: "QA", status: true });
          finalResponseObject.groupAdminStats[3].data[0].value = await User.count({ "id": { $in: groupMemberIds }, "$or" : [{ "roleDetails.roles": { "$in": analystRoleId.id } }, { "roleDetails.primaryRole": analystRoleId.id }]});
          finalResponseObject.groupAdminStats[3].data[1].value = await User.count({ "id": { $in: groupMemberIds }, "$or" : [{ "roleDetails.roles": { "$in": qaRoleId.id } }, { "roleDetails.primaryRole": qaRoleId.id }]});
          finalResponseObject.groupAdminStats[3].data[2].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": clientRepRoleId.id } }, { "roleDetails.primaryRole": clientRepRoleId.id }]});
          finalResponseObject.groupAdminStats[3].data[3].value = await User.count({ "$or" : [{ "roleDetails.roles": { "$in": companyRepRoleId.id } }, { "roleDetails.primaryRole": companyRepRoleId.id }]});
        } else if (userRoles[roleIndex] == "Analyst") {
          let taskIds = await TaskAssignment.find({ analystId: user.id, status: true }).distinct('id');
          finalResponseObject.analystStats[0].data[0].value = await TaskAssignment.count({ analystId: user.id, taskStatus: 'Completed', status: true});
          finalResponseObject.analystStats[0].data[1].value = await TaskAssignment.count({ analystId: user.id, taskStatus: { $ne: 'Completed'}, status: true});
          finalResponseObject.analystStats[1].data[0].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: 'QA', status: true });
          finalResponseObject.analystStats[1].data[1].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: { $in: ['Client Representative', 'Company Representative'] }, status: true });
          finalResponseObject.analystStats[2].data[0].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, isAccepted: true, status: true });
          finalResponseObject.analystStats[2].data[1].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, status: true });
        } else if (userRoles[roleIndex] == "QA") {
          let taskIds = await TaskAssignment.find({ qaId: user.id, status: true }).distinct('id');
          finalResponseObject.qaStats[0].data[0].value = await TaskAssignment.count({ qaId: user.id, taskStatus: 'Completed', status: true});
          finalResponseObject.qaStats[0].data[1].value = await TaskAssignment.count({ qaId: user.id, taskStatus: { $ne: 'Completed'}, status: true});
          finalResponseObject.qaStats[1].data[0].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: 'QA', status: true });
          finalResponseObject.qaStats[1].data[1].value = await ErrorDetails.count({ taskId: { $in: taskIds }, raisedBy: { $in: ['Client Representative', 'Company Representative'] }, status: true });
          finalResponseObject.qaStats[2].data[0].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, isAccepted: true, status: true });
          finalResponseObject.qaStats[2].data[1].value = await TaskSlaLog.count({ taskId: { $in: taskIds }, status: true });
        }
      }
      return res.status(200).json({ status: "200", message: "Data retrieved sucessfully", data: finalResponseObject ? finalResponseObject : null});
    }
  } catch (error) {
    return res.status(400).json({
      status: "400",
      message: error.message ? error.message : "Failed to get user details!",
    });
  }
}
  
