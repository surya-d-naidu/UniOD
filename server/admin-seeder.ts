import { hashPassword } from "./auth";
import { storage } from "./storage";
import { executeWithRetry } from "./db";

export async function seedAdminUser() {
  // Define all admin users to seed
  const adminUsers = [
    {
      registrationNumber: "ADMIN_AIR",
      password: "p@$$m0rb",
      name: "Admin Air",
      mobile: "1234567890"
    },
    {
      registrationNumber: "surya-d-naidu",
      password: "I am the Phantom of The Wild",
      name: "Surya D Naidu",
      mobile: "1234567891"
    },
    {
      registrationNumber: "atul_akella",
      password: "uranium is dangerous",
      name: "Atul Akella",
      mobile: "1234567892"
    }
  ];

  // Maximum number of retries for admin seeding
  const MAX_SEEDING_RETRIES = 3;
  
  for (const adminUser of adminUsers) {
    for (let attempt = 1; attempt <= MAX_SEEDING_RETRIES; attempt++) {
      try {
        console.log(`Attempting to seed admin user ${adminUser.registrationNumber} (attempt ${attempt}/${MAX_SEEDING_RETRIES})...`);
        
        // Check if admin already exists
        const existingAdmin = await executeWithRetry(() => 
          storage.getUserByRegistrationNumber(adminUser.registrationNumber)
        );
        
        if (!existingAdmin) {
          const hashedPassword = await hashPassword(adminUser.password);
          
          await executeWithRetry(() => 
            storage.createUser({
              registrationNumber: adminUser.registrationNumber,
              name: adminUser.name,
              mobile: adminUser.mobile,
              password: hashedPassword,
              role: "admin",
              isApproved: true
            })
          );
          
          console.log(`✅ Admin user ${adminUser.registrationNumber} created successfully`);
        } else {
          console.log(`👍 Admin user ${adminUser.registrationNumber} already exists`);
        }
        
        // If we get here, seeding was successful for this user
        break;
        
      } catch (error) {
        if (attempt === MAX_SEEDING_RETRIES) {
          console.error(`❌ Error seeding admin user ${adminUser.registrationNumber} after all attempts:`, error);
          // Continue with next admin user instead of throwing
        } else {
          console.warn(`⚠️ Attempt ${attempt} failed for ${adminUser.registrationNumber}, retrying...`, error);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
  }
  
  console.log("✅ Admin seeding process completed");
}
