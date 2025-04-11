import express from 'express';
import axios from 'axios';

const router = express.Router();
const API_URL = "https://f1api.dev/api/"

class Driver {
    constructor(driverId, name, standing, wins, points, championships) {
        this.driverId = driverId;
        this.name = name;
        this.standing = standing;
        this.wins = wins;
        this.points = points;
        this.championships = championships;
        this.podiums = 0;
        this.winPercentage = 0;
        this.dnfs = 0;
        this.pointsPerRace = 0;
        this.racePositions = [];
        this.avgRacePosition = 0;
        this.fastestLaps = 0;
        this.poles = 0;
        this.qualyPositions = [];
        this.avgQualyPosition = 0;
    }
}

let drivers = []

// create driver objects from first api call
const response = await axios.get(API_URL + "current/drivers-championship");
try {
    response.data.drivers_championship.forEach(driverData => {
        const d1 = new Driver(
            driverData.driverId,
            driverData.driver.shortName,
            driverData.position,
            driverData.wins,
            driverData.points,
            driverData.championships
        );
        drivers.push(d1);
    });
} catch (error) {
    console.error("Error processing drivers championship data:", error.message);
}

let numberOfRaces = 0;
// get all podiums and dnfs of each driver
for (let index = 1; index < 21; index++) {
    try {
        const raceResults = await axios.get(API_URL + `2025/${index}/race`);
        const results = raceResults.data.races.results;
        for (let index = 0; index < results.length; index++) {
            const driver = drivers.find(driver => driver.name === results[index].driver.shortName);
            if (index >= 0 && index <= 2) {
                driver.podiums += 1;
            }
            if (results[index].position == "NC") {
                driver.dnfs++;
            }
            if (typeof results[index].position === 'number') {
                driver.racePositions.push(results[index].position);
            }
        }
        numberOfRaces++;
    } catch (error) {
        console.log(error.response.data);
        break;
    }
}

// get all fastest laps
try {
    const results = await axios.get(API_URL + "current");
    const raceResults = results.data.races;
    for(let index = 0; index < raceResults.length; index++) {
        if (!raceResults[index].winner) {
            break;
        }
        const driver = drivers.find(driver => driver.driverId === raceResults[index].fast_lap.fast_lap_driver_id);
        driver.fastestLaps++;
    };
} catch (error) {
        console.log(error.response.data);
}

// get qualy positions and calculate average Qualy position
for (let index = 1; index < 21; index++) {
    try {
        const results = await axios.get(API_URL + `2025/${index}/qualy`);
        const qualyResults = results.data.races.qualyResults;
        qualyResults.forEach(qualyDriver => {
            const d1 = drivers.find(driver => driver.driverId === qualyDriver.driverId);
            if (typeof qualyDriver.gridPosition === "number") {
                d1.qualyPositions.push(qualyDriver.gridPosition);
                if (qualyDriver.gridPosition == 1) {
                    d1.poles++;
                }
            }
            
        });
    } catch (error) {
        console.log(error.response.data);
        break;
    }
}

// calculate winning percentage, points per race, avgRacePosition and avgQualyPosition
drivers.forEach(driver => {
    if (driver.wins) {
        driver.winPercentage = ((driver.wins / numberOfRaces) * 100).toFixed() + "%";
    } else {
        driver.winPercentage = "Not available";
    }

    driver.pointsPerRace = driver.points / numberOfRaces;

    driver.avgQualyPosition = driver.qualyPositions.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / driver.qualyPositions.length;

    if (driver.racePositions.length == 0) {
        driver.avgRacePosition = "Not finished a race yet"
    } else {
        driver.avgRacePosition = driver.racePositions.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / driver.racePositions.length;
    }
});

console.log(drivers);

router.get("/", (req, res) => res.render("drivers.ejs", { drivers }));

export default router;