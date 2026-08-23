import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { admins, categories, products } from "./schema";
import { env } from "../env";

async function seed() {
  console.log("🌱 Seeding database...");

  // --- Admin user ---
  const existingAdmin = await db
    .select()
    .from(admins)
    .where(eq(admins.username, env.ADMIN_USERNAME))
    .get();

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await db.insert(admins).values({
      username: env.ADMIN_USERNAME,
      passwordHash,
    });
    console.log(`✅ Created admin user "${env.ADMIN_USERNAME}"`);
  } else {
    console.log(`ℹ️  Admin user "${env.ADMIN_USERNAME}" already exists, skipping.`);
  }

  // --- Sample categories (only if none exist) ---
  const existingCategories = await db.select().from(categories).all();
  if (existingCategories.length === 0) {
    const inserted = await db
      .insert(categories)
      .values([
        { name: "أكواد ستيم", emoji: "🎮", description: "أكواد ألعاب ستيم الرقمية", sortOrder: 1 },
        { name: "اشتراكات نتفلكس", emoji: "🎬", description: "اشتراكات نتفلكس شهرية", sortOrder: 2 },
        { name: "بطاقات شحن", emoji: "📱", description: "بطاقات شحن رصيد وإنترنت", sortOrder: 3 },
      ])
      .returning();

    console.log(`✅ Created ${inserted.length} sample categories`);

    const steamCategory = inserted.find((c) => c.name === "أكواد ستيم");
    if (steamCategory) {
      await db.insert(products).values([
        {
          categoryId: steamCategory.id,
          name: "GTA V (Sample)",
          content: "SAMPLE-CODE-0001",
          contentType: "code",
          priceLabel: "250 EGP",
        },
        {
          categoryId: steamCategory.id,
          name: "Elden Ring (Sample)",
          content: "SAMPLE-CODE-0002",
          contentType: "code",
          priceLabel: "400 EGP",
        },
      ]);
      console.log("✅ Created sample products");
    }
  } else {
    console.log("ℹ️  Categories already exist, skipping sample data.");
  }

  console.log("🎉 Seeding complete.");
}

seed()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
