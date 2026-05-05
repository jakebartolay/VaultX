import "server-only";

import mysql from "mysql2/promise";

const globalForMysql = globalThis as unknown as {
  vaultxMysqlPool?: mysql.Pool;
};

export function getMysqlPool() {
  if (!globalForMysql.vaultxMysqlPool) {
    globalForMysql.vaultxMysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE || "vaultx",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      connectionLimit: 10,
      decimalNumbers: true,
      namedPlaceholders: true,
    });
  }

  return globalForMysql.vaultxMysqlPool;
}

export async function queryRows<T extends mysql.RowDataPacket[]>(
  sql: string,
  values?: mysql.QueryOptions["values"],
) {
  const [rows] = await getMysqlPool().query<T>(sql, values);

  return rows;
}
