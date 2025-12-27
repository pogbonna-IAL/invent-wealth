/**
 * Script to update Toronto Apartment property with gallery images
 * Run with: npx tsx scripts/update-toronto-apartment-gallery.ts
 */

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Prisma 6.x reads DATABASE_URL from environment automatically
const prisma = new PrismaClient();

async function updateTorontoApartmentGallery() {
  try {
    console.log("🔄 Updating Toronto Apartment gallery images...");

    // Find Toronto Apartment property (checking for various possible slugs)
    const possibleSlugs = [
      "toronto-apartment",
      "toronto-apartment-toronto",
      "modern-apartment-toronto",
      "city-apartment-toronto"
    ];

    let property = null;
    for (const slug of possibleSlugs) {
      property = await prisma.property.findUnique({
        where: { slug },
      });
      if (property) {
        console.log(`✅ Found property with slug: ${slug}`);
        break;
      }
    }

    // If not found by slug, try searching by name
    if (!property) {
      const properties = await prisma.property.findMany({
        where: {
          OR: [
            { name: { contains: "Toronto", mode: "insensitive" } },
            { city: { contains: "Toronto", mode: "insensitive" } },
          ],
        },
      });

      if (properties.length > 0) {
        property = properties[0];
        console.log(`✅ Found property: ${property.name} (slug: ${property.slug})`);
      }
    }

    if (!property) {
      console.log("❌ Toronto Apartment property not found. Available properties:");
      const allProperties = await prisma.property.findMany({
        select: { slug: true, name: true, city: true },
      });
      allProperties.forEach((p) => {
        console.log(`   - ${p.name} (${p.slug}) - ${p.city}`);
      });
      return;
    }

    // Create gallery array with all 20 Toronto images
    const galleryImages = Array.from({ length: 20 }, (_, i) => 
      `/images/properties/Toronto-Apartment/Toronto-Invent-${i + 1}.jpg`
    );

    // Set cover image to the first image
    const coverImage = galleryImages[0];

    // Update the property
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: {
        coverImage,
        gallery: galleryImages,
      },
    });

    console.log(`\n✅ Successfully updated ${updated.name}!`);
    console.log(`   Cover Image: ${updated.coverImage}`);
    console.log(`   Gallery Images: ${Array.isArray(updated.gallery) ? updated.gallery.length : 0} images`);
    console.log(`   First few images:`);
    if (Array.isArray(updated.gallery)) {
      updated.gallery.slice(0, 5).forEach((img, i) => {
        console.log(`     ${i + 1}. ${img}`);
      });
    }
  } catch (error) {
    console.error("❌ Error updating gallery:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateTorontoApartmentGallery();

