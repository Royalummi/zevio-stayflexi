import mysql from "mysql2/promise";

(async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "zevio",
  });

  await conn.query(
    "ALTER TABLE properties MODIFY COLUMN living_area INT DEFAULT 1 COMMENT 'Number of living rooms'",
  );
  console.log("Column modified");

  const [res] = await conn.execute(
    "UPDATE properties SET living_area = 1 WHERE living_area IS NULL",
  );
  console.log("NULLs updated:", res.affectedRows, "rows");

  const [rows] = await conn.execute(
    "SELECT COLUMN_DEFAULT, COLUMN_COMMENT FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?",
    ["zevio", "properties", "living_area"],
  );
  console.log("Column info:", rows[0]);

  const [data] = await conn.execute(
    "SELECT living_area, COUNT(*) as cnt FROM properties GROUP BY living_area",
  );
  console.log("Values:", data);

  await conn.end();
})();
