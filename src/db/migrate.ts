import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";

console.log("🔄 Running migrations...");
migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log("✅ Migrations complete.");
