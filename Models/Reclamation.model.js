const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({


    nom: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    telephone: {
        type: String,
        required: true,
    },
    etat: {
        type: String,
        enum: ['En attente', 'Résolu','Impossible'],
        default: 'En attente'
    }

}, { timestamps: true });


const Reclamation = mongoose.model("Reclamation", ReclamationSchema);
module.exports = Reclamation;