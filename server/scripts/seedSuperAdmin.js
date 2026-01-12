import { seedSuperAdmin } from "../src/database/seeders/superAdminSeeder.js";

seedSuperAdmin()
  .then(() => {
    console.log("✅ Seeder finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeder failed", err);
    process.exit(1);
  });
