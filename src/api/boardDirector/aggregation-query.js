'use strict';
import { format } from 'date-fns';
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

                    _id: '$din',
                    din: { '$first': '$din' },
                    BOSP004: { '$first': '$BOSP004' },
                    BODR005: { '$first': '$BODR005' },
                    dob: { '$first': '$dob' },
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
                    localField: "din",
                    foreignField: "din",
                    let: { status: "$status" },
                    pipeline: [{
                        $match: {
                            "status": true
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
                $match: {
                    BOSP004: { $regex: new RegExp(name, 'gi') }
                }
            },
            {
                $group: {

                    _id: '$din',
                    din: { '$first': '$din' },
                    BOSP004: { '$first': '$BOSP004' },
                    BODR005: { '$first': '$BODR005' },
                    dob: { '$first': '$dob' }
                }
            }, {
                $lookup: {
                    from: "boarddirectors",
                    localField: "din",
                    foreignField: "din",
                    let: { status: "$status" },
                    pipeline: [{
                        $match: {
                            "status": true
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
    let data = {
        cessationDate: body?.cessationDate,
        BOSP004: body?.name,
        BODR005: body?.gender,
        dob: body?.dob,
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
    let data = {
        cessationDate: directorsDetails?.cessationDate,
        BOSP004: body?.name ? body?.name : directorsDetails?.BOSP004,
        BODR005: body?.gender ? body?.gender : directorsDetails?.BODR005,
        dob: body?.dob ? body?.dob : directorsDetails?.dob,
        companyName: directorsDetails?.companyName,
        companyId: directorsDetails?.companyId,
        joiningDate: directorsDetails?.joiningDate,
        memberType: directorsDetails?.memberType,
        cin: directorsDetails?.cin,
        din: body?.din,
        createdBy: user,
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

export function checkIfRedundantDataHaveCessationDate(data) {
    try {
        // sort the joining date
        data.sort(compare);
        for (let i = 0; i < data?.length; i++) {
            for (let j = i + 1; j < data?.length; j++) {
                if ((data[i]?.cin == data[j]?.cin) && (data[i]?.status == true && data[j]?.cin == true)) {
                    if ((data[i]?.joiningDate || data[i]?.joiningDate !== '')
                        && (data[j]?.joiningDate || data[j]?.joiningDate !== '')) {
                        const earlierCompanyToHaveJoined =
                            new Date(data[i]?.joiningDate).getTime() < new Date(data[j]?.joiningDate).getTime()
                                ? data[i] : data[j];

                        if (!earlierCompanyToHaveJoined?.cessationDate || earlierCompanyToHaveJoined?.cessationDate == '') {
                            return {
                                status: 409,
                                message: `${earlierCompanyToHaveJoined?.companyName} joined at"  ${format(new Date(earlierCompanyToHaveJoined?.joiningDate), 'dd-MM-yyyy')}" does not have cessation Date.Please check`
                            }
                        }
                    }
                }
            }
        }
        return {};
    } catch (error) {
        console.log(error?.message);
    }
}


function compare(a, b) {
    if (new Date(a.joiningDate) < new Date(b.joiningDate)) {
        return -1;
    }
    if (new Date(a.joiningDate) > new Date(b.joiningDate)) {
        return 1;
    }
    return 0;
}

