const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

const conversionToObject = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    select 
      *
      from
      state;`;
  const getStatesQueryResponse = await db.all(getStatesQuery);
  response.send(
    getStatesQueryResponse.map((state) => conversionToObject(state))
  );
});

// API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateOnIdQuery = `
    select *
    from state
    where state_id = ${stateId};`;
  const getStateResponse = await db.get(getStateOnIdQuery);
  response.send(conversionToObject(getStateResponse));
});

// API 3
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API4
const convertDistrictDbObject = (Object) => {
  return {
    districtId: Object.district_id,
    districtName: Object.district_name,
    stateId: Object.state_id,
    cases: Object.cases,
    cured: Object.cured,
    active: Object.active,
    deaths: Object.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getDistrictsQuery);
  response.send(convertDistrictDbObject(district));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId} 
  `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases)  ,
      SUM(cured) ,
      SUM(active) ,
      SUM(deaths) 
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const statsResponse = await db.get(getStateStatsQuery);
  response.send({
    totalCases: statsResponse["SUM(cases)"],
    totalCured: statsResponse["SUM(cured)"],
    totalActive: statsResponse["SUM(active)"],
    totalDeaths: statsResponse["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
