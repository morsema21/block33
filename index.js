const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);
const app = express();

app.use(express.json());

app.use(require("morgan")("dev"));

const PORT = process.env.PORT || 3000;

//update employee
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE employees
    SET name=$1, department_id=$2, updated_at=now()
    WHERE id=$3`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});
//delete employee
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE from employees WHERE id=$1;
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});
//post employee
app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL =
      "INSERT INTO employees(name, department_id) values($1, $2) RETURNING *";
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});
// get departments
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * from departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});
//get employees
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});
//seed departments&&employees
const init = async () => {
  await client.connect();
  let SQL = `
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS departments;
      CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        department VARCHAR(255)
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        name VARCHAR(255) NOT NULL,
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
      `;
  await client.query(SQL);
  console.log("table created");
  SQL = `
      INSERT INTO departments(department) values('MANAGEMENT');
      INSERT INTO departments(department) values('PART TIME');
      INSERT INTO departments(department) values('FULL TIME');
      INSERT INTO employees(name, department_id) values('JOHN',(SELECT id from departments WHERE department='FULL TIME'));
      INSERT INTO employees(name, department_id) values('JANE',(SELECT id from departments WHERE department='MANAGEMENT'));
      INSERT INTO employees(name, department_id) values('JIM',(SELECT id from departments WHERE department='PART TIME'));
      `;
  await client.query(SQL);
  console.log("data seeded");
  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  });
};
init();
