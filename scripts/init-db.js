import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log("🔍 Checking database connection...");

    // Test the connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Check if tables exist by trying to count users
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);

    // Check if accounts table exists
    const accountCount = await prisma.account.count();
    console.log(`📊 Current account count: ${accountCount}`);

    // Check if calendars table exists
    const calendarCount = await prisma.calendar.count();
    console.log(`📊 Current calendar count: ${calendarCount}`);

    console.log("✅ Database is ready!");
    console.log("");
    console.log("🎯 Next steps:");
    console.log("1. Start your development server: npm run dev");
    console.log("2. Sign in to your application");
    console.log("3. Connect your email account through Aurinko");
    console.log(
      "4. Your data will be automatically created as you use the app",
    );
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.log("");
    console.log("🔧 Troubleshooting:");
    console.log("1. Make sure your DATABASE_URL is correct in .env");
    console.log("2. Run: npx prisma db push");
    console.log("3. Run: npx prisma generate");
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
