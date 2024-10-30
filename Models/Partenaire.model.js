const mongoose = require("mongoose");


const partenaireSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    logo: { type: String },
    lien: { type: String, required: true },
    adresse:{ type: String , required: true},
    telephone:{ type: String , required: true},
    status: { type: Boolean, default: false },
    location: { type: String , required:true },
}, { timestamps: true });



const Partenaire = mongoose.model("Partenaire", partenaireSchema);
module.exports = Partenaire;