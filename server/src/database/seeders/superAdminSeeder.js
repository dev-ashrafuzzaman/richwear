import bcrypt from "bcryptjs";
import { connectDB, getDB } from "../../config/db.js";
import { withCreateFields } from "../../utils/commonFields.js";

export const seedSuperAdmin = async () => {
  await connectDB();
  const db = getDB();

  const email = "superadmin@system.com";

  const exists = await db.collection("users").findOne({ email });

  if (exists) {
    console.log("✅ Super Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash("SuperAdmin@123", 10);

  const superAdmin = {
    name: "Super Admin",
    email,
    password: passwordHash,

    roleName: "Super Admin",
    roleId: null,

    permissions: ["*"],
    branchId: null,

    isSuperAdmin: true,
    status: "active",

    ...withCreateFields()
  };

  await db.collection("users").insertOne(superAdmin);

  console.log("🚀 Super Admin created successfully");
  console.log("📧 Email:", email);
  console.log("🔑 Password: SuperAdmin@123");
};
