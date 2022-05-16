'use strict';

import { getSortedYear } from '../../api/datapoints/dp-details-functions';
import { LATEST_YEARS } from '../../constants/latest-year';

export function getLatestCurrentYear(year) {
    try {
        let currentYear = [];
        if (year.includes(', ')) {
            currentYear = year.split(', ');
        } else {
            currentYear.push(year);
        }
        currentYear = getSortedYear(currentYear);
        let latestYear = '';

        currentYear.map((current) => {
            if (LATEST_YEARS.includes(current)) {
                if (latestYear !== '') {
                    latestYear += ', ';
                }
                latestYear += current;
            }
        });
        year = latestYear;
        return year;
    } catch (error) {
        console.log(error?.message);
    }
}