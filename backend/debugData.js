require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const ProviderProfile = require("./src/models/ProviderProfile");
const ServiceCategory = require("./src/models/ServiceCategory");
const Service = require("./src/models/Service");

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const userCount = await User.countDocuments();
    const profileCount = await ProviderProfile.countDocuments();
    const catCount = await ServiceCategory.countDocuments();
    const serviceCount = await Service.countDocuments();
    const activeServiceCount = await Service.countDocuments({ isActive: true });

    console.log("--- DATABASE DIAGNOSTICS ---");
    console.log(`Users: ${userCount}`);
    console.log(`Provider Profiles: ${profileCount}`);
    console.log(`Categories: ${catCount}`);
    console.log(`Total Services: ${serviceCount}`);
    console.log(`Active Services (isActive:true): ${activeServiceCount}`);

    if (serviceCount > 0) {
      const oneService = await Service.findOne().populate("category").populate("provider");
      console.log("\n--- SAMPLE SERVICE DATA ---");
      console.log(JSON.stringify(oneService, null, 2));
    } else {
      console.log("\n[WARNING] No services found in the database!");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Diagnostics failed:", error);
    process.exit(1);
  }
};

debug();
