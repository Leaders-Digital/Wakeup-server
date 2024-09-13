const mongoose = require("mongoose");


const partenaireSchema = new mongoose.Schema({

    nom: { type: String, required: true },
    logo: { type: String, required: true },
    lien: { type: String, required: true },
    status: { type: Boolean, default: false }
});



const Partenaire = mongoose.model("Partenaire", partenaireSchema);
module.exports = Partenaire;