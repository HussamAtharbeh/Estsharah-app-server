
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
// DATE
pg.types.setTypeParser(1082, (value) => value); 
// NUMERIC
pg.types.setTypeParser(1700, (value) => parseFloat(value)); 

const pgclient = new pg.Client(process.env.DATABASE_URL);

pgclient.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
  process.exit(1);
});

export default pgclient;
