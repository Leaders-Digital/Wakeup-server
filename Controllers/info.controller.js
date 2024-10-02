const infoData = require("../Models/info.model");


// Create a new info data entry
const createInfoData = async (req, res) => {
  try {
    const { email, fixNumber, gsm, whatsapp, adresse, facebook, instagram, tiktok, promo } = req.body;

    const newInfoData = new infoData({
      email,
      fixNumber,
      gsm,
      whatsapp,
      adresse,
      facebook,
      instagram,
      tiktok,
      promo,
    });

    const savedInfoData = await newInfoData.save();
    res.status(201).json(savedInfoData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création des données', error });
  }
};

// Get all info data entries
const getAllInfoData = async (req, res) => {
  try {
    const infoDataEntries = await InfoData.find();
    res.status(200).json(infoDataEntries);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données', error });
  }
};

// Get info data by ID
const getInfoDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const infoDataEntry = await InfoData.findById(id);
    if (!infoDataEntry) {
      return res.status(404).json({ message: 'Données non trouvées' });
    }
    res.status(200).json(infoDataEntry);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données', error });
  }
};

// Update info data by ID
const updateInfoData = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fixNumber, gsm, whatsapp, adresse, facebook, instagram, tiktok, promo } = req.body;

    const updatedInfoData = await InfoData.findByIdAndUpdate(
      id,
      { email, fixNumber, gsm, whatsapp, adresse, facebook, instagram, tiktok, promo },
      { new: true, runValidators: true }
    );

    if (!updatedInfoData) {
      return res.status(404).json({ message: 'Données non trouvées' });
    }

    res.status(200).json(updatedInfoData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des données', error });
  }
};

// Delete info data by ID
const deleteInfoData = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInfoData = await InfoData.findByIdAndDelete(id);

    if (!deletedInfoData) {
      return res.status(404).json({ message: 'Données non trouvées' });
    }

    res.status(200).json({ message: 'Données supprimées avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression des données', error });
  }
};

module.exports = {
  createInfoData,
  getAllInfoData,
  getInfoDataById,
  updateInfoData,
  deleteInfoData,
};
