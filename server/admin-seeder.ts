import { hashPassword } from "./auth";
import { storage } from "./storage";

export async function seedAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByRegistrationNumber("ADMIN001");
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("admin123");
      
      await storage.createUser({
        registrationNumber: "ADMIN001",
        name: "System Administrator",
        mobile: "1234567890",
        password: hashedPassword,
        role: "admin",
        isApproved: true
      });
      
      console.log("✅ Admin user created successfully");
    } else {
      console.log("👍 Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  }
}
