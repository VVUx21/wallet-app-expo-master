import { neon } from "@neondatabase/serverless";

import "dotenv/config";

const normalizeDbUrl = (value) => {
  if (!value) return "";
  return value.trim().replace(/^"|"$/g, "");
};

const DATABASE_URL = normalizeDbUrl(process.env.DATABASE_URL);

if (!DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to backend/.env");
  process.exit(1);
}

// Creates a SQL connection using our DB URL
export const sql = neon(DATABASE_URL,{
  fetchOptions: {
    signal: AbortSignal.timeout(30000) 
  }
});

export async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title  VARCHAR(255) NOT NULL,
      amount  DECIMAL(10,2) NOT NULL,
      category VARCHAR(255) NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE
    )`;

    console.log("Database initialized successfully");
  } catch (error) {
    const dbHost = new URL(DATABASE_URL).hostname;
    console.log("Error initializing DB", error?.sourceError?.cause?.error);

    if (error?.sourceError?.cause?.code === "ETIMEDOUT") {
      console.error(
        `Network timeout while connecting to ${dbHost}. This is usually an outbound network/firewall/VPN issue, not a SQL schema issue.`
      );
      console.error(
        "Try: 1) disable VPN/proxy temporarily, 2) allow outbound 443/5432, 3) try a different Neon region, 4) test from host OS if using WSL."
      );
    }

    process.exit(1); // status code 1 means failure, 0 success
  }
}
