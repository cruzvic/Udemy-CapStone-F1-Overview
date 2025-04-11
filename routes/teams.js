import express from 'express';
import axios from 'axios';

const router = express.Router();
const API_URL = "https://f1api.dev/api/"


class Team {
    constructor(teamId, name, standing, wins, points, championships) {
        this.teamId = teamId;
        this.name = name;
        this.standing = standing;
        this.wins = wins;
        this.points = points;
        this.championships = championships;
        this.podiums = 0;
        this.winPercentage = 0;
        this.dnfs = 0;
        this.pointsPerRace = 0;
        this.fastestLaps = 0;
        this.poles = 0;
    }
}

let teams = []

// create team objects from first api call
const response = await axios.get(API_URL + "current/constructors-championship");
response.data.constructors_championship.forEach(teamData => {
    const d1 = new Team(
        teamData.teamId,
        teamData.team.teamName,
        teamData.position,
        teamData.wins,
        teamData.points,
        teamData.team.constructorsChampionships
    );
    teams.push(d1);
});

let numberOfRaces = 0;
// get all podiums and dnfs of each team
for (let index = 1; index < 21; index++) {
    try {
        const raceResults = await axios.get(API_URL + `2025/${index}/race`);
        const results = raceResults.data.races.results;
        for (let index = 0; index < results.length; index++) {
            const team = teams.find(team => team.teamId === results[index].team.teamId);
            if (index >= 0 && index <= 2) {
                team.podiums += 1;
            }
            if (results[index].position == "NC") {
                team.dnfs++;
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
        const team = teams.find(team => team.teamId === raceResults[index].fast_lap.fast_lap_team_id);
        team.fastestLaps++;
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
            const d1 = teams.find(team => team.teamId === qualyDriver.teamId);
            if (typeof qualyDriver.gridPosition === "number") {
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

// calculate winning percentage, points per race
teams.forEach(team => {
    if (team.wins) {
        team.winPercentage = ((team.wins / numberOfRaces) * 100).toFixed() + "%";
    } else {
        team.winPercentage = "Not available";
    }

    team.pointsPerRace = team.points / numberOfRaces;
});

console.log(teams);


router.get("/", (req, res) => {
    res.render("teams.ejs", { teams });
});

export default router;