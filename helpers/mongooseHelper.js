/**
 * Convertit un document Mongoose ou un tableau de documents en objets simples
 * @param {any} data - Document Mongoose ou tableau de documents
 * @returns {any} Objet simple ou tableau d'objets simples
 */
function convertMongooseToPlain(data) {
  // Si c'est un tableau
  if (Array.isArray(data)) {
    return data.map(item => convertMongooseToPlain(item));
  }

  // Si c'est un document Mongoose
  if (data && typeof data === 'object') {
    let plainObject;
    
    // Si le document a _doc (propriété interne Mongoose), l'utiliser
    if (data._doc) {
      plainObject = data._doc;
    }
    // Si c'est un document Mongoose avec toObject()
    else if (typeof data.toObject === 'function') {
      plainObject = data.toObject();
    }
    // Si c'est un objet avec des métadonnées Mongoose, les supprimer
    else if (data.$__ || data.$isNew !== undefined) {
      plainObject = JSON.parse(JSON.stringify(data));
    }
    // Si c'est déjà un objet simple
    else {
      plainObject = data;
    }
    
    // Convertir récursivement les propriétés qui sont des tableaux (comme variants)
    if (plainObject && typeof plainObject === 'object') {
      const result = {};
      for (const key in plainObject) {
        if (Array.isArray(plainObject[key])) {
          result[key] = plainObject[key].map(item => convertMongooseToPlain(item));
        } else if (plainObject[key] && typeof plainObject[key] === 'object' && (plainObject[key].$__ || plainObject[key].$isNew !== undefined || typeof plainObject[key].toObject === 'function')) {
          result[key] = convertMongooseToPlain(plainObject[key]);
        } else {
          result[key] = plainObject[key];
        }
      }
      return result;
    }
    
    return plainObject;
  }

  // Si c'est déjà un objet simple, le retourner tel quel
  return data;
}

module.exports = {
  convertMongooseToPlain,
};

