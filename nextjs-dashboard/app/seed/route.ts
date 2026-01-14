import bcrypt from "bcrypt";
import postgres from "postgres";

import { invoices, customers, revenue, users } from "../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );
  console.log(insertedUsers);
  return insertedUsers;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );
  console.log(insertedInvoices);

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );
  console.log(insertedCustomers);

  return insertedCustomers;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `
    )
  );
  console.log(insertedRevenue);

  return insertedRevenue;
}

export async function GET() {
  try {
    console.log("Seeding seeding");
    const result = await sql.begin((sql) => [
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}

// import bcrypt from "bcrypt";
// import sqlServer from "mssql";
// import { invoices, customers, revenue, users } from "../lib/placeholder-data";

// // Parse DATABASE_URL_SATRIA
// const config = {
//   user: process.env.DB_USER || "satria_user",
//   password: process.env.DB_PASSWORD || "SatriaPassword123!",
//   server: process.env.DB_HOST || "localhost",
//   port: Number(process.env.DB_PORT || 1433),
//   database: process.env.DB_NAME || "master", // connect to master first
//   options: {
//     encrypt: true,
//     trustServerCertificate: true,
//   },
// };

// let pool: sqlServer.ConnectionPool;

// async function getPool() {
//   if (!pool) {
//     pool = await sqlServer.connect(config);
//   }
//   return pool;
// }

// // Helper to run a query
// async function run(query: string, params: any[] = []) {
//   const p = await getPool();
//   return p.request().input("params", params).query(query);
// }

// async function seedUsers() {
//   const p = await getPool();

//   await p.request().query(`
//     IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
//     CREATE TABLE users (
//       id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
//       name NVARCHAR(255) NOT NULL,
//       email NVARCHAR(255) NOT NULL UNIQUE,
//       password NVARCHAR(255) NOT NULL
//     );
//   `);

//   const insertedUsers = await Promise.all(
//     users.map(async (user) => {
//       const hashedPassword = await bcrypt.hash(user.password, 10);
//       return p
//         .request()
//         .input("id", sqlServer.UniqueIdentifier, user.id)
//         .input("name", sqlServer.NVarChar, user.name)
//         .input("email", sqlServer.NVarChar, user.email)
//         .input("password", sqlServer.NVarChar, hashedPassword).query(`
//           IF NOT EXISTS (SELECT 1 FROM users WHERE id = @id)
//             INSERT INTO users (id, name, email, password)
//             VALUES (@id, @name, @email, @password)
//         `);
//     })
//   );

//   return insertedUsers;
// }

// async function seedInvoices() {
//   const p = await getPool();

//   await p.request().query(`
//     IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='invoices' AND xtype='U')
//     CREATE TABLE invoices (
//       id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
//       customer_id UNIQUEIDENTIFIER NOT NULL,
//       amount INT NOT NULL,
//       status NVARCHAR(255) NOT NULL,
//       date DATE NOT NULL
//     );
//   `);

//   const insertedInvoices = await Promise.all(
//     invoices.map((invoice) =>
//       p
//         .request()
//         .input("customer_id", sqlServer.UniqueIdentifier, invoice.customer_id)
//         .input("amount", sqlServer.Int, invoice.amount)
//         .input("status", sqlServer.NVarChar, invoice.status)
//         .input("date", sqlServer.Date, invoice.date).query(`
//           IF NOT EXISTS (SELECT 1 FROM invoices WHERE id = NEWID())
//             INSERT INTO invoices (customer_id, amount, status, date)
//             VALUES (@customer_id, @amount, @status, @date)
//         `)
//     )
//   );

//   return insertedInvoices;
// }

// async function seedCustomers() {
//   const p = await getPool();

//   await p.request().query(`
//     IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
//     CREATE TABLE customers (
//       id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
//       name NVARCHAR(255) NOT NULL,
//       email NVARCHAR(255) NOT NULL,
//       image_url NVARCHAR(255) NOT NULL
//     );
//   `);

//   const insertedCustomers = await Promise.all(
//     customers.map((customer) =>
//       p
//         .request()
//         .input("id", sqlServer.UniqueIdentifier, customer.id)
//         .input("name", sqlServer.NVarChar, customer.name)
//         .input("email", sqlServer.NVarChar, customer.email)
//         .input("image_url", sqlServer.NVarChar, customer.image_url).query(`
//           IF NOT EXISTS (SELECT 1 FROM customers WHERE id = @id)
//             INSERT INTO customers (id, name, email, image_url)
//             VALUES (@id, @name, @email, @image_url)
//         `)
//     )
//   );

//   return insertedCustomers;
// }

// async function seedRevenue() {
//   const p = await getPool();

//   await p.request().query(`
//     IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='revenue' AND xtype='U')
//     CREATE TABLE revenue (
//       month NVARCHAR(4) NOT NULL PRIMARY KEY,
//       revenue INT NOT NULL
//     );
//   `);

//   const insertedRevenue = await Promise.all(
//     revenue.map((rev) =>
//       p
//         .request()
//         .input("month", sqlServer.NVarChar, rev.month)
//         .input("revenue", sqlServer.Int, rev.revenue).query(`
//           IF NOT EXISTS (SELECT 1 FROM revenue WHERE month = @month)
//             INSERT INTO revenue (month, revenue)
//             VALUES (@month, @revenue)
//         `)
//     )
//   );

//   return insertedRevenue;
// }

// export async function GET() {
//   try {
//     console.log("Seeding database...");

//     await seedUsers();
//     await seedCustomers();
//     await seedInvoices();
//     await seedRevenue();

//     return new Response(
//       JSON.stringify({ message: "Database seeded successfully" }),
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error(error);
//     return new Response(JSON.stringify({ error: error }), {
//       status: 500,
//     });
//   } finally {
//     pool?.close();
//   }
// }
