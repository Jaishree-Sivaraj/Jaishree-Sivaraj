'use strict';
import { BoardMembers } from '../boardMembers'
import { Kmp } from '../kmp';
import { NUMBER } from '../../constants/dp-datatype';

export async function getTotalExpectedYear(allCollectedData, distinctYears, dpType, datapoints) {
    try {
        let allMember = [];
        let expectedCount = 0;
        allCollectedData.map(member => {
            allMember.push(member?.memberName);
        });
        let memberDetails = []
        if (dpType == BOARD_MATRIX) {
            memberDetails = await BoardMembers.find({
                BOSP004: { $in: allMember },
                status: true
            });
        } else if (dpType == KMP_MATRIX) {
            memberDetails = Kmp.find({
                MASP003: { $in: allMember },
                status: true
            })
        }
        let totalCountByAllMembers = []
        for (let memberIndex = 1; memberIndex < memberDetails?.length; memberIndex++) {
            let totalCollectedYears = 0;
            let memberStartYear = memberDetails[memberIndex]?.startDate.getFullYear();
            for (let yearIndex = 1; yearIndex < distinctYears.length; yearIndex++) {
                const splityear = distinctYears[yearIndex].split('-');
                if (memberStartYear == splityear[0] || memberStartYear == splityear[1]) {
                    totalCollectedYears = +1;
                }
            }
            totalCountByAllMembers.push(totalCollectedYears);
        }

        totalCountByAllMembers.map(total => {
            expectedCount = expectedCount + datapoints.length * total;
        });
        return expectedCount;
    } catch (error) {
        console.log(error?.message);
    }
}

export function getQualitativeAndQuantitativeCount(datapoints) {
    let totalQualitativeDatapoints = 0, totalQuantativeDatapoints = 0;
    datapoints.map((datapoint) => {
        if (datapoint?.dataType !== NUMBER) {
            totalQualitativeDatapoints += 1
        } else {
            totalQuantativeDatapoints += 1
        }
    });

    return { totalQualitativeDatapoints, totalQuantativeDatapoints };
}