'use strict';

export function getAggregationQueryToGetAllDirectors(page, limit) {
    try {
        const query = [
            //TODO: update using  din and companyId .
            { $skip: (page - 1) * limit },
            { $limit: +limit },
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
                    BOSP004: 1,
                    BODR005: 1,
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