const Client = require("../Models/Client.model");

// Create a new client
exports.createClient = async (req, res) => {
  try {
    const client = new Client(req.body); // Create a new client with the request body
    await client.save(); // Save to the database
    res.status(201).json({ message: "Client created successfully", client });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating client", error: error.message });
  }
};

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find(); // Fetch all clients
    res.status(200).json(clients);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving clients", error: error.message });
  }
};

// Get a single client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id); // Find client by ID
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json(client);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving client", error: error.message });
  }
};

// Update a client by ID
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({ message: "Client updated successfully", client });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating client", error: error.message });
  }
};

// Delete a client by ID
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id); // Find and delete client by ID
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting client", error: error.message });
  }
};
