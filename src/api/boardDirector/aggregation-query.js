'use strict';
import { format } from 'date-fns';
import { BoardDirector } from '.';
import { storeFileInS3 } from "../../services/utils/aws-s3"

/*
TODO: Note to be taken while understanding the query.
!We are not deleting directors hence,
!even the ones with status false is shown as 
!status: false is for companies and not for directors
 */

export function getAggregationQueryToGetAllDirectors(page, limit, searchValue) {
    try {
        const query = [];
        let searchQuery = {}
        if (searchValue && searchValue !== '') {
            searchQuery = {
                $or: [
                    { din: { $regex: new RegExp(searchValue, 'gi') } },
                    { cin: { $regex: new RegExp(searchValue, 'gi') } },
                    { companyName: { $regex: new RegExp(searchValue, 'gi') } },
                    { BOSP004: { $regex: new RegExp(searchValue, 'gi') } },
                ],
            }
            query.push({ $match: searchQuery })
        }

        query.push( //TODO: update using  din and companyId .
            {
                $group: {

                    _id: '$BOSP004',
                    din: { '$first': '$din' },
                    BOSP004: { '$first': '$BOSP004' },
                    BODR005: { '$first': '$BODR005' },
                    dob: { '$first': '$dob' },
                    memberLevel: { '$first': '$memberLevel' },
                    profilePhoto: { '$first': '$profilePhoto' },
                    socialLinks: { '$first': '$socialLinks' },
                    qualification: { '$first': '$qualification' },
                    createdAt: { '$first': '$createdAt' }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: +limit
            },
            {
                $lookup: {
                    from: "boarddirectors",
                    localField: "_id",
                    foreignField: "BOSP004",
                    let: { status: "$status" },
                    pipeline: [{
                        $match: {
                            "status": true,
                            "companyId": { $ne: null }
                        }
                    }],
                    as: "companies"
                }
            },
            {
                $project:
                {
                    din: 1,
                    _id: 0,
                    name: '$BOSP004',
                    gender: '$BODR005',
                    dob: 1,
                    profilePhoto: 1,
                    socialLinks: 1,
                    qualification: 1,
                    memberLevel: 1,
                    'companies.companyId': 1,
                    'companies.cin': 1,
                    'companies.companyName': 1,
                    'companies.joiningDate': 1,
                    'companies.cessationDate': 1,
                    'companies.memberType': 1,
                    'companies._id': 1
                }
            }
        )

        return { query, searchQuery };

    } catch (error) {
        console.log(error?.message);
    }
}

export function getDirector(name) {
    try {
        const query = [
            //TODO: update using  din.
            {
                $addFields: {
                    trimedDbName: { $trim: { input: '$BOSP004' } }
                }
            }, {
                $match: {
                    trimedDbName: name.trim()
                }
            },
            {
                $group: {

                    _id: '$BOSP004',
                    din: { '$first': '$din' },
                    BOSP004: { '$first': '$BOSP004' },
                    BODR005: { '$first': '$BODR005' },
                    dob: { '$first': '$dob' },
                    memberLevel: { '$first': '$memberLevel' },
                    profilePhoto: { '$first': '$profilePhoto' },
                    socialLinks: { '$first': '$socialLinks' },
                    qualification: { '$first': '$qualification' }
                }
            }, {
                $lookup: {
                    from: "boarddirectors",
                    localField: "BOSP004",
                    foreignField: "BOSP004",
                    let: { status: "$status" },
                    pipeline: [{
                        $match: {
                            "status": true,
                            "companyId": { $ne: null }
                        }
                    }],
                    as: "companies"
                }
            },
            {
                $project:
                {
                    din: 1,
                    _id: 0,
                    name: '$BOSP004',
                    gender: '$BODR005',
                    dob: 1,
                    memberLevel: 1,
                    profilePhoto: 1,
                    socialLinks: 1,
                    qualification: 1,
                    'companies.companyId': 1,
                    'companies.cin': 1,
                    'companies.companyName': 1,
                    'companies.joiningDate': 1,
                    'companies.cessationDate': 1,
                    'companies.memberType': 1,
                    'companies._id': 1
                }
            }
        ];
        return query;
    } catch (error) {
        console.log(error?.message);
    }
}

export function getUpdateObject(body, directorsDetails, user) {
    let yearTimeStamp = Math.floor(new Date(body?.cessationDate).getTime() / 1000);
    let data = {
        cessationDate: body?.cessationDate,
        BOSP004: body?.name,
        BODR005: body?.gender,
        dob: body?.dob,
        endDateTimeStamp: yearTimeStamp,
        companyName: body?.companyName,
        companyId: body?.companyId,
        joiningDate: body?.joiningDate,
        memberType: body?.memberType,
        cin: body?.cin,
        din: body?.din,
        createdBy: user,
        status: true,
        isPresent: true
    }

    if (body?.status == true || body?.status == false) {
        data = {
            ...data,
            status: body?.status
        }
    } else if (directorsDetails?.status == true || directorsDetails?.status == false) {
        data = {
            ...data,
            status: directorsDetails?.status
        }
    }
    return data;
}

/*
TODO: Things to be noted
* We are not supposed to update any field except for name , din , dob, gender.
* Rest we do not update as this is update of director and not company
* The above one is for company  
 */

export function getUpdateObjectForDirector(body, directorsDetails, user) {
    let yearTimeStamp = Math.floor(new Date(directorsDetails?.cessationDate).getTime() / 1000);

    let data = {
        cessationDate: directorsDetails?.cessationDate,
        BOSP004: body?.name ? body?.name : directorsDetails?.BOSP004,
        BODR005: body?.gender ? body?.gender : directorsDetails?.BODR005,
        dob: body?.dob ? body?.dob : directorsDetails?.dob,
        companyName: directorsDetails?.companyName,
        companyId: directorsDetails?.companyId,
        joiningDate: directorsDetails?.joiningDate,
        memberType: directorsDetails?.memberType,
        endDateTimeStamp: yearTimeStamp,
        cin: directorsDetails?.cin,
        din: body?.din,
        createdBy: user,
        profilePhoto: directorsDetails?.profilePhoto,
        socialLinks: directorsDetails?.socialLinks,
        qualification: directorsDetails?.qualification,
        memberLevel: directorsDetails?.memberLevel,
        status: true

    }
    if (directorsDetails?.status == true || directorsDetails?.status == false) {
        data = {
            ...data,
            status: directorsDetails?.status
        }
    }
    return data;
}

export async function getQueryData(name, updateObject) {
    try {

        const nullValidationForDIN = [
            { din: { $ne: '' } },
            { din: { $ne: undefined } },
            { din: { $ne: null } },
        ];

        let dinConditionToCheckRedundantDIN = [
            { din: updateObject?.din.trim() },
        ];

        let nameConditionToCheckRedundantName = [{
            BOSP004: updateObject?.name.trim()
        }];

        return { dinConditionToCheckRedundantDIN, nameConditionToCheckRedundantName, nullValidationForDIN };
    } catch (error) {
        console.log(error?.message);
    }
}

export async function checkRedundantNameOrDIN(name, dinConditionToCheckRedundantDIN, nameConditionToCheckRedundantName, nullValidationForDIN) {
    try {
        const [checkingRedundantDIN, checkingRedundantName] = await Promise.all([
            BoardDirector.aggregate([
                {
                    $addFields: {
                        BOSP004: { $trim: { input: '$BOSP004' } }
                    }
                }, {
                    $match: {
                        status: true,
                        BOSP004: { $ne: name },
                        $or: [...dinConditionToCheckRedundantDIN],
                        $and: nullValidationForDIN
                    }

                }]),
            BoardDirector.aggregate([
                {
                    $addFields: {
                        BOSP004: { $trim: { input: '$BOSP004' } }
                    }
                }, {
                    $match: {
                        status: true,
                        BOSP004: { $ne: name },
                        $or: nameConditionToCheckRedundantName
                    }
                }])
        ]);

        let message = '';
        if (checkingRedundantDIN?.length > 0 && checkingRedundantName?.length > 0) {
            message = 'DIN and name'
        } else if (checkingRedundantName?.length > 0) {
            message = 'Name'
        } else if (checkingRedundantDIN?.length > 0) {
            message = 'DIN';
        }

        if (checkingRedundantDIN?.length > 0 || checkingRedundantName?.length > 0) {
            return {
                status: 409,
                message: `${message} already exists`
            }
        }
        return {};
    } catch (error) { console.log(error?.message); }
}

export async function updateCompanyData(updateObject, findQuery, data) {
    try {
        // If the company already exists then update else create.
        let updateDirector;
        if (updateObject?.isPresent) {
            updateDirector = await BoardDirector.findOneAndUpdate({
                ...findQuery,
                isPresent: updateObject?.isPresent,
                _id: updateObject?._id
            }, {
                $set: data
            },
                {
                    new: true
                });
        } else {
            updateDirector = await BoardDirector.findOneAndUpdate({ ...findQuery, isPresent: updateObject?.isPresent }, {
                $set: data
            },
                {
                    upsert: true,
                    new: true
                });
        }

        return updateDirector;
    } catch (error) { console.log(error?.message) }
}

export async function updateDirectorData(name, details, user, updateObject) {
    try {
        let updateDirector;
        const { profilePhoto, socialLinks, qualification, memberLevel } = details;
        const directorsDetails = await BoardDirector.aggregate([
            {
                $addFields: {
                    name: { $trim: { input: '$BOSP004' } }
                }
            }, {
                $match: {
                    $or: [{
                        name
                    }
                        , {
                        name: updateObject?.name.trim()
                    }]
                }
            }]
        );

        if (directorsDetails?.length < 0) {
            return res.status(409).json({
                status: 409,
                message: `Director with name ${BOSP004} does not exists`
            })
        }
        for (let i = 0; i < directorsDetails?.length; i++) {
            const director = directorsDetails[i];

            const profilePhotoItem = profilePhoto;
            let profilePhotoFileType = '';
            let profilePhotoFileName = '';

            if (profilePhotoItem && profilePhotoItem !== '' && director.profilePhoto !== profilePhotoItem) {
                profilePhotoFileType = profilePhotoItem?.split(';')[0]?.split('/')[1];
                profilePhotoFileName = director.BOSP004 + new Date().getTime() + '.' + profilePhotoFileType;
                await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, profilePhotoFileName, profilePhotoItem)
            }

            updateObject = updateObject ? updateObject : director;
            director.profilePhoto = profilePhotoFileName;
            director.socialLinks = socialLinks;
            director.qualification = qualification;
            director.memberLevel = memberLevel;
            const updateDirectorObject = getUpdateObjectForDirector(updateObject, director, user);
            // Makes sense to update with the updated name only
            updateDirector = await BoardDirector.findOneAndUpdate({
                _id: director?._id,
                $or: [{ BOSP004: updateObject?.name },
                { BOSP004: name }]

            }, {
                $set: updateDirectorObject
            }, { new: true });
        }

        return updateDirector;
    } catch (error) {
        console.log(error?.message)
    }
}

// This is handled in F.E
// export function checkIfRedundantDataHaveCessationDate(data) {
//     try {
//         // sort the joining date
//         data.sort(compare);
//         for (let i = 0; i < data?.length; i++) {
//             for (let j = i + 1; j < data?.length; j++) {
//                 if ((data[i]?.cin == data[j]?.cin) && (data[i]?.status == true && data[j]?.status == true)) {
//                     if ((data[i]?.joiningDate || data[i]?.joiningDate !== '')
//                         && (data[j]?.joiningDate || data[j]?.joiningDate !== '')) {

//                         // Change the conditiion Date, month ,year
//                         const earlierCompanyToHaveJoined =

//                             new Date(data[i]?.joiningDate).getTime() < new Date(data[j]?.joiningDate).getTime()
//                                 ? data[i] : data[j];

//                         if (!earlierCompanyToHaveJoined?.cessationDate || earlierCompanyToHaveJoined?.cessationDate == '') {
//                             return {
//                                 status: 409,
//                                 message: `${earlierCompanyToHaveJoined?.companyName} joined at "${format(new Date(earlierCompanyToHaveJoined?.joiningDate), 'dd-MM-yyyy')}" does not have cessation Date. Please check!!`
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         return {};
//     } catch (error) {
//         console.log(error?.message);
//     }
// }

// function compare(a, b) {
//     if (new Date(a.joiningDate) < new Date(b.joiningDate)) {
//         return -1;
//     }
//     if (new Date(a.joiningDate) > new Date(b.joiningDate)) {
//         return 1;
//     }
//     return 0;
// }