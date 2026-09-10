import mysql2 from "mysql2";
import { Sequelize } from "sequelize-typescript";

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE as string,
  process.env.MYSQL_USER as string,
  process.env.MYSQL_PASSWORD as string,
  {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    timezone: "-03:00",
    dialect: "mysql",
    dialectModule: mysql2,
  },
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado ao banco de dados");
  } catch (e) {
    console.log("Erro ao conectar: ", e);
  }
})();

export default sequelize;
