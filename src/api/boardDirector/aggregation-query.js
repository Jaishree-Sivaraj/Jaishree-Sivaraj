'use strict';

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

export function getDirector(BOSP004) {
    try {
        const query = [
            //TODO: update using  din.
            {
                $match: {
                    BOSP004,
                    status: true
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
        cessationDate: new Date(body?.cessationDate) ? new Date(body?.cessationDate) : directorsDetails?.cessationDate,
        BOSP004: body?.name ? body?.name : directorsDetails?.BOSP004,
        BODR005: body?.gender ? body?.gender : directorsDetails?.BODR005,
        dob: body?.dob ? body?.dob : directorsDetails?.dob,
        companyName: body?.companyName ? body?.companyName : directorsDetails?.companyName,
        joiningDate: new Date(body?.joiningDate) ? new Date(body?.joiningDate) : directorsDetails?.joiningDate,
        memberType: body?.memberType ? body?.memberType : directorsDetails?.memberType,
        cin: body?.cin ? body?.cin : directorsDetails?.cin,
        user: user,
        status: true
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

export function getUpdateObjectForDirector(body, directorsDetails, user) {
    let data = {
        cessationDate: directorsDetails?.cessationDate,
        BOSP004: body?.name ? body?.name : directorsDetails?.BOSP004,
        BODR005: body?.gender ? body?.gender : directorsDetails?.BODR005,
        dob: body?.dob ? body?.dob : directorsDetails?.dob,
        companyName: directorsDetails?.companyName,
        joiningDate: directorsDetails?.joiningDate,
        memberType: directorsDetails?.memberType,
        cin: directorsDetails?.cin,
        user: user,
        status: true

    }
    if (directorsDetails?.status == true || directorsDetails?.status == false) {
        data = {
            ...data,
            status: directorsDetails?.status
        }
    }
    return
}