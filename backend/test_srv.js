
const mongoose = require('mongoose');

const uri2 = "mongodb+srv://homeserv:FhZSxErlKwkJKWl5@ac-lwtdrbp.0qygzas.mongodb.net/homeserv?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri2)
  .then(() => {
    console.log("Connected using SRV (ac-lwtdrbp)!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("SRV connection error (ac-lwtdrbp):", err.message);
    process.exit(1);
  });
