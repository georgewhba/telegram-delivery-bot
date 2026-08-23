import { env } from "./env";
import { createApiApp } from "./api";
import { startBot } from "./bot";

async function main() {
  const app = createApiApp();
  app.listen(env.PORT, () => {
    console.log(`🌐 Dashboard API listening on http://localhost:${env.PORT}`);
  });

  await startBot();
}

main().catch((err) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});
