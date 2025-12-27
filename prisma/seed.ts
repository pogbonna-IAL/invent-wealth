import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create Prisma Client (Prisma 6.x reads DATABASE_URL from environment automatically)
const prisma = new PrismaClient();

// Helper function to generate slug from name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Cities in Nigeria
const cities = [
  { city: "Lagos", country: "Nigeria" },
  { city: "Abuja", country: "Nigeria" },
  { city: "Port Harcourt", country: "Nigeria" },
  { city: "Ibadan", country: "Nigeria" },
  { city: "Kano", country: "Nigeria" },
  { city: "Calabar", country: "Nigeria" },
];

const propertyTypes = ["APARTMENT", "VILLA", "STUDIO", "HOUSE", "CONDO", "TOWNHOUSE"] as const;
const shortletModels = ["ENTIRE_HOME", "PRIVATE_ROOM"] as const;

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        name: `Test User ${i}`,
        role: "INVESTOR",
        emailVerified: new Date(),
        profile: {
          create: {
            phone: `+234800000000${i}`,
            address: `${i} Test Street`,
            country: "Nigeria",
            dob: new Date(1990, 0, 1),
          },
        },
        onboarding: {
          create: {
            status: "COMPLETED",
            kycStatus: "APPROVED",
            riskAnswers: {
              riskTolerance: "moderate",
              investmentExperience: "intermediate",
            },
          },
        },
      },
    });
    users.push(user);
    console.log(`✅ Created user: ${user.email}`);
  }

  // Create admin user for development login (admin/admin123)
  const bcrypt = require("bcryptjs");
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "pogbonna@gmail.com" },
    update: {
      role: "ADMIN", // Ensure role is ADMIN even if user exists
      passwordHash: adminPasswordHash, // Ensure password hash is set
    },
    create: {
      email: "pogbonna@gmail.com",
      name: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      passwordHash: adminPasswordHash,
      profile: {
        create: {},
      },
      onboarding: {
        create: {
          status: "COMPLETED",
          kycStatus: "APPROVED",
        },
      },
    },
  });
  console.log(`✅ Created/Updated admin: ${admin.email} (Login: admin/admin123)`);

  // Create 10 properties
  const properties = [];
  const propertyNames = [
    "Luxury Beachfront Villa Lekki",
    "Modern Apartment Victoria Island",
    "Executive Studio Ikoyi",
    "Premium Condo Abuja",
    "Spacious House Port Harcourt",
    "Townhouse Ibadan",
    "Boutique Villa Calabar",
    "City Apartment Kano",
    "Waterfront Villa Lagos",
    "Garden House Abuja",
    "Skyline Condo Lagos",
    "Heritage Villa Port Harcourt",
  ];

  for (let i = 0; i < propertyNames.length; i++) {
    const name = propertyNames[i];
    const cityData = cities[i % cities.length];
    const propertyType = propertyTypes[i % propertyTypes.length];
    const shortletModel = shortletModels[i % shortletModels.length];
    const slug = slugify(name);

    const totalShares = [50000, 75000, 100000, 125000][i % 4];
    const pricePerShare = 600000.00; // NGN600,000.00 per share (stored as NGN)
    const targetRaise = Number(totalShares) * Number(pricePerShare);
    const availableShares = Math.floor(totalShares * (0.3 + Math.random() * 0.5)); // 30-80% available
    const projectedYield = [7.5, 8.0, 8.5, 9.0, 9.5, 10.0][i % 6];

    const property = await prisma.property.create({
      data: {
        slug,
        name,
        city: cityData.city,
        country: cityData.country,
        addressShort: `${i + 1} ${cityData.city} Street`,
        description: `A beautiful ${propertyType.toLowerCase()} located in the heart of ${cityData.city}. This property offers modern amenities, excellent location, and strong rental potential. Perfect for short-term rentals with high occupancy rates.`,
        highlights: [
          "Prime location",
          "Modern amenities",
          "High rental yield",
          "Professional management",
          "Fully furnished",
        ],
        coverImage: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800`,
        gallery: [
          `https://images.unsplash.com/photo-${1500000000000 + i}?w=800`,
          `https://images.unsplash.com/photo-${1500000000001 + i}?w=800`,
          `https://images.unsplash.com/photo-${1500000000002 + i}?w=800`,
        ],
        propertyType,
        shortletModel,
        totalShares,
        availableShares,
        pricePerShare,
        minShares: [10, 5, 20, 15][i % 4],
        targetRaise,
        status: availableShares > totalShares * 0.2 ? "OPEN" : "FUNDED",
        projectedAnnualYieldPct: projectedYield,
      },
    });
    properties.push(property);
    console.log(`✅ Created property: ${property.name} (${property.slug})`);
  }

  // Create investments for some users
  console.log("\n📊 Creating investments...");
  for (let i = 0; i < 3; i++) {
    const user = users[i];
    const property = properties[i];
    const shares = property.minShares * (2 + i); // Invest 2-4x minimum

    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        propertyId: property.id,
        shares,
        pricePerShareAtPurchase: property.pricePerShare,
        totalAmount: Number(property.pricePerShare) * shares,
        status: "CONFIRMED",
      },
    });
    console.log(`✅ Created investment: User ${user.email} → ${shares} shares in ${property.name}`);
  }

  // Create 6 months of rental statements for first 5 properties
  console.log("\n💰 Creating rental statements...");
  const now = new Date();
  for (let propIndex = 0; propIndex < 5; propIndex++) {
    const property = properties[propIndex];
    
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);

      // Generate realistic rental data
      const baseRevenue = 50000 + Math.random() * 30000; // 50k-80k
      const occupancyRate = 65 + Math.random() * 25; // 65-90%
      const grossRevenue = baseRevenue * (occupancyRate / 100);
      const operatingCosts = grossRevenue * (0.15 + Math.random() * 0.1); // 15-25% of revenue
      const managementFee = grossRevenue * 0.1; // 10% management fee
      const netDistributable = grossRevenue - operatingCosts - managementFee;
      const adr = grossRevenue / 30; // Average daily rate

      const rentalStatement = await prisma.rentalStatement.create({
        data: {
          propertyId: property.id,
          periodStart,
          periodEnd,
          grossRevenue,
          operatingCosts,
          managementFee,
          netDistributable,
          occupancyRatePct: occupancyRate,
          adr,
          notes: `Monthly rental statement for ${periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        },
      });

      // Create distribution for this statement
      const distribution = await prisma.distribution.create({
        data: {
          propertyId: property.id,
          rentalStatementId: rentalStatement.id,
          declaredAt: periodEnd,
          totalDistributed: netDistributable,
          status: monthOffset <= 2 ? "PAID" : "DECLARED", // Last 3 months paid
        },
      });

      // Create payouts for users who invested in this property
      const investments = await prisma.investment.findMany({
        where: {
          propertyId: property.id,
          status: "CONFIRMED",
        },
      });

      for (const investment of investments) {
        const payoutAmount = (Number(investment.shares) / property.totalShares) * netDistributable;
        
        await prisma.payout.create({
          data: {
            userId: investment.userId,
            propertyId: property.id,
            distributionId: distribution.id,
            rentalStatementId: rentalStatement.id,
            sharesAtRecord: investment.shares,
            amount: payoutAmount,
            status: monthOffset <= 2 ? "PAID" : "PENDING",
            paidAt: monthOffset <= 2 ? periodEnd : null,
          },
        });
      }

      console.log(
        `✅ Created rental statement for ${property.name} (${periodStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })})`
      );
    }
  }

  // Create transactions
  console.log("\n💳 Creating transactions...");
  const investments = await prisma.investment.findMany({
    where: { status: "CONFIRMED" },
  });

  for (const investment of investments) {
    await prisma.transaction.create({
      data: {
        userId: investment.userId,
        type: "INVESTMENT",
        amount: investment.totalAmount,
        currency: "NGN", // Amounts are stored in NGN
        reference: `INV-${investment.id.slice(0, 8)}`,
      },
    });
  }

  const payouts = await prisma.payout.findMany({
    where: { status: "PAID" },
  });

  for (const payout of payouts) {
    await prisma.transaction.create({
      data: {
        userId: payout.userId,
        type: "PAYOUT",
        amount: payout.amount,
        currency: "NGN", // Amounts are stored in NGN
        reference: `PAY-${payout.id.slice(0, 8)}`,
      },
    });
  }
  console.log(`✅ Created ${investments.length + payouts.length} transactions`);

  // Create documents
  console.log("\n📄 Creating documents...");
  
  // Global documents
  await prisma.document.createMany({
    data: [
      {
        scope: "GLOBAL",
        title: "Terms of Service",
        url: "/documents/terms-of-service.pdf",
        docType: "AGREEMENT",
      },
      {
        scope: "GLOBAL",
        title: "Privacy Policy",
        url: "/documents/privacy-policy.pdf",
        docType: "AGREEMENT",
      },
      {
        scope: "GLOBAL",
        title: "Investment Guide",
        url: "/documents/investment-guide.pdf",
        docType: "PROSPECTUS",
      },
    ],
  });

  // Property documents
  for (const property of properties.slice(0, 5)) {
    await prisma.document.createMany({
      data: [
        {
          scope: "PROPERTY",
          propertyId: property.id,
          title: `${property.name} - Property Prospectus`,
          url: `/documents/properties/${property.slug}/prospectus.pdf`,
          docType: "PROSPECTUS",
        },
        {
          scope: "PROPERTY",
          propertyId: property.id,
          title: `${property.name} - Purchase Agreement`,
          url: `/documents/properties/${property.slug}/agreement.pdf`,
          docType: "AGREEMENT",
        },
      ],
    });
  }

  // User statements
  for (const user of users.slice(0, 3)) {
    await prisma.document.create({
      data: {
        scope: "USER",
        userId: user.id,
        title: `Investment Statement - ${new Date().toLocaleDateString()}`,
        url: `/documents/users/${user.id}/statement.pdf`,
        docType: "STATEMENT",
      },
    });
  }
  console.log("✅ Created documents");

  // Create referral codes
  console.log("\n🎁 Creating referral codes...");
  for (const user of users.slice(0, 3)) {
    await prisma.referralCode.create({
      data: {
        userId: user.id,
        code: `REF${user.id.slice(0, 8).toUpperCase()}`,
      },
    });
  }
  console.log("✅ Created referral codes");

  // Create audit logs
  console.log("\n📝 Creating audit logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "USER_CREATED",
        metadata: { count: users.length },
      },
      {
        userId: admin.id,
        action: "PROPERTY_CREATED",
        metadata: { count: properties.length },
      },
      {
        action: "SYSTEM_INITIALIZED",
        metadata: { timestamp: new Date().toISOString() },
      },
    ],
  });
  console.log("✅ Created audit logs");

  console.log("\n✨ Seeding completed successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   - ${users.length + 1} users (${users.length} investors, 1 admin)`);
  console.log(`   - ${properties.length} properties`);
  console.log(`   - ${investments.length} investments`);
  console.log(`   - ${await prisma.rentalStatement.count()} rental statements`);
  console.log(`   - ${await prisma.distribution.count()} distributions`);
  console.log(`   - ${await prisma.payout.count()} payouts`);
  console.log(`   - ${await prisma.transaction.count()} transactions`);
  console.log(`   - ${await prisma.document.count()} documents`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
