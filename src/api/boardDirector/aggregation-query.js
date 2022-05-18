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
                $match: {
                    status: true
                }
            }, {
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

                    from: 'boarddirectors',
                    localField: 'din',
                    foreignField: 'din',
                    as: 'companies'
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
                    'companies.memberType': 1
                }
            }
        )

        return { query, searchQuery };

    } catch (error) {
        console.log(error?.message);
    }
}

export function getDirector(din) {
    try {
        const query = [
            //TODO: update using  din.
            {
                $match: {
                    din,
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

                    from: 'boarddirectors',
                    localField: 'din',
                    foreignField: 'din',
                    as: 'companies'
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
                    'companies.memberType': 1
                }
            }

        ];

        return query;

    } catch (error) {
        console.log(error?.message);
    }
}

export function getUpdateObject(body, company, directorsDetails) {
    return {
        cessationDate: company?.cessationDate ? company?.cessationDate : directorsDetails?.cessationDate,
        BOSP004: body?.name ? body?.name : directorsDetails?.BOSP004,
        BODR005: body?.gender ? body?.gender : directorsDetails?.BODR005,
        dob: body?.dob ? body?.dob : directorsDetails?.dob,
        companyName: company && company?.companyName ? company?.companyName : directorsDetails?.companyName,
        joiningDate: company && company?.joiningDate ? company?.joiningDate : directorsDetails?.joiningDate,
        memberType: company && company?.memberType ? company?.memberType : directorsDetails?.memberType,
        status: company ? company?.status : directorsDetails?.status
    }
}