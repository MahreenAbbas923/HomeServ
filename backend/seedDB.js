require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
const ProviderProfile = require("./src/models/ProviderProfile");
const ServiceCategory = require("./src/models/ServiceCategory");
const Service = require("./src/models/Service");

const categories = [
  { name: "Plumbing", description: "Fixing leaks, pipes, and drains, very reliable and fast", icon: "plumbing" },
  { name: "Electrical", description: "Washing machine, lights, and wiring expert support", icon: "electrical" },
  { name: "Cleaning", description: "Home, office, and carpet cleaning professional services", icon: "cleaning" }
];

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected! Cleaning old data...");

    await User.deleteMany({ email: "provider@test.com" });
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await ProviderProfile.deleteMany({});

    console.log("Creating Dummy Provider...");
    const providerUser = await User.create({
      name: "Pro Fixer",
      email: "provider@test.com",
      password: "Password123",
      phone: "1234567890",
      role: "provider",
      city: "Lahore",
      isVerified: true
    });

    await ProviderProfile.create({
      user: providerUser._id,
      bio: "Expert in home repairs and maintenance with 15 years experience.",
      specializations: ["Plumbing", "Electrical"],
      serviceAreas: ["Lahore", "Gulberg"],
      isApproved: true
    });

    console.log("Seeding categories...");
    const createdCats = await ServiceCategory.insertMany(categories);

    console.log("Seeding services...");
    await Service.create([
      {
        title: "Full Home Plumbing Checkup",
        description: "A comprehensive inspection of all your pipes and drains to prevent leaks.",
        category: createdCats[0]._id,
        provider: providerUser._id,
        basePrice: 2000,
        pricingType: "fixed"
      },
      {
        title: "Electrical Wiring Repair",
        description: "Safe and professional repair of faulty wiring and short circuits in your home.",
        category: createdCats[1]._id,
        provider: providerUser._id,
        basePrice: 1500,
        pricingType: "hourly"
      },
      {
        title: "Deep Kitchen Cleaning",
        description: "Professional cleaning of all surfaces, cabinets, and appliances in your kitchen.",
        category: createdCats[2]._id,
        provider: providerUser._id,
        basePrice: 3000,
        pricingType: "fixed"
      }
    ]);

    console.log("Successfully seeded Provider, Categories, and Services!");
    console.log("Closing connection...");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
