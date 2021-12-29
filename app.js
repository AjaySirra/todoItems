const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
//GET Todos
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//GET specific
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

//POST details
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `INSERT INTO todo
    (id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  await database.run(postQuery);
  response.send("Todo Successfully Added");
});

//UPDATE details
const hasStatus = (requestBody) => {
  return requestBody.status !== undefined;
};
const hasPriority = (requestBody) => {
  return requestBody.priority !== undefined;
};
const hasTodo = (requestBody) => {
  return requestBody.todo !== undefined;
};
app.put("/todos/:todoId/", async (request, response) => {
  let updatedColumn = "";
  const { todoId } = request.params;
  let updateQuery = "";
  switch (true) {
    case hasStatus(request.body):
      updatedColumn = "Status";
      break;
    case hasPriority(request.body):
      updatedColumn = "Priority";
      break;
    case hasTodo(request.body):
      updatedColumn = "Todo";
      break;
  }
  const previousQuery = `SELECT *
  FROM todo WHERE  id=${todoId};`;
  const getDetailsResponse = await database.get(previousQuery);
  const {
    status = getDetailsResponse.status,
    todo = getDetailsResponse.todo,
    priority = getDetailsResponse.priority,
  } = request.body;
  const updateDetailsQuery = `
        UPDATE todo 
        SET status='${status}',
        priority='${priority}',
        todo='${todo}'
        WHERE id=${todoId};`;
  await database.run(updateDetailsQuery);
  response.send(`${updatedColumn} Updated`);
});

//Delete Details
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo 
    WHERE id=${todoId}`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
