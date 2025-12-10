const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');
dotenv.config();

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Génère une URL signée (presigned URL) pour un objet S3
 * @param {string} key - La clé S3 de l'objet (chemin dans le bucket)
 * @param {number} expiresIn - Durée de validité en secondes (défaut: 1 heure)
 * @returns {Promise<string>} URL signée
 */
async function getSignedUrlForS3Object(key, expiresIn = 3600) {
  const originalKey = key; // Sauvegarder la clé originale
  try {
    if (!key) {
      return null;
    }

    // Si la clé est déjà une URL complète, extraire la clé
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        // Pour les URLs S3, la clé est dans le pathname
        // Format: https://bucket-name.s3.region.amazonaws.com/key/path
        // ou: https://access-point-alias.s3.region.amazonaws.com/key/path
        // ou: https://access-point-alias.s3-accesspoint.region.amazonaws.com/key/path
        let pathname = url.pathname;
        
        // Enlever le premier '/' s'il existe
        if (pathname.startsWith('/')) {
          pathname = pathname.substring(1);
        }
        
        // Le pathname devrait être directement la clé S3
        key = pathname;
      } catch (urlError) {
        console.error('Erreur lors du parsing de l\'URL:', urlError);
        // Si l'URL ne peut pas être parsée, essayer d'extraire manuellement
        // Chercher le pattern après .amazonaws.com/ ou .s3-accesspoint.
        const match = key.match(/(?:\.s3(?:-accesspoint)?\.[a-z0-9-]+\.amazonaws\.com\/|\.amazonaws\.com\/)(.+)$/);
        if (match && match[1]) {
          key = match[1];
        } else {
          // Si on ne peut pas extraire, retourner null
          console.error('Impossible d\'extraire la clé de l\'URL:', key);
          return null;
        }
      }
    }

    if (!key) {
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL signée pour:', key, error);
    // En cas d'erreur, si la clé originale était une URL, la retourner
    // Sinon retourner null
    if (originalKey && originalKey.startsWith('http')) {
      return originalKey; // Retourner l'URL originale si c'était déjà une URL
    }
    return null;
  }
}

/**
 * Génère des URLs signées pour un tableau d'objets
 * @param {Array<string>} keys - Tableau de clés S3
 * @param {number} expiresIn - Durée de validité en secondes
 * @returns {Promise<Array<string>>} Tableau d'URLs signées
 */
async function getSignedUrlsForS3Objects(keys, expiresIn = 3600) {
  if (!Array.isArray(keys)) {
    return [];
  }
  
  const promises = keys.map(key => getSignedUrlForS3Object(key, expiresIn));
  return Promise.all(promises);
}

/**
 * Transforme un objet ou un tableau d'objets en remplaçant les URLs S3 par des URLs signées
 * @param {any} data - Données à transformer (objet, tableau, ou valeur simple)
 * @param {Array<string>} imageFields - Champs contenant des URLs d'images (ex: ['mainPicture', 'picture', 'icon'])
 * @param {number} expiresIn - Durée de validité en secondes
 * @returns {Promise<any>} Données avec URLs signées
 */
async function transformS3UrlsToSigned(data, imageFields = ['mainPicture', 'picture', 'icon', 'image', 'banner', 'logo'], expiresIn = 3600) {
  if (!data) {
    return data;
  }

  // Si c'est un tableau
  if (Array.isArray(data)) {
    const transformed = await Promise.all(
      data.map(item => transformS3UrlsToSigned(item, imageFields, expiresIn))
    );
    return transformed;
  }

  // Si c'est un objet
  if (typeof data === 'object' && data !== null) {
    const transformed = { ...data };
    
    for (const field of imageFields) {
      if (transformed[field]) {
        // Si c'est un tableau d'images
        if (Array.isArray(transformed[field])) {
          const signedUrls = await getSignedUrlsForS3Objects(transformed[field], expiresIn);
          // Remplacer seulement les URLs qui ont pu être signées (non null)
          transformed[field] = signedUrls.map((signedUrl, index) => 
            signedUrl || transformed[field][index] // Garder l'original si la signature a échoué
          );
        } 
        // Si c'est une seule image
        else if (typeof transformed[field] === 'string') {
          const signedUrl = await getSignedUrlForS3Object(transformed[field], expiresIn);
          // Utiliser l'URL signée si disponible, sinon garder l'originale
          if (signedUrl) {
            transformed[field] = signedUrl;
          }
          // Si signedUrl est null, on garde l'URL originale
        }
      }
    }

    // Traiter récursivement les objets imbriqués (comme variants)
    if (transformed.variants && Array.isArray(transformed.variants)) {
      transformed.variants = await Promise.all(
        transformed.variants.map(variant => 
          transformS3UrlsToSigned(variant, imageFields, expiresIn)
        )
      );
    }

    if (transformed.variantDetails && Array.isArray(transformed.variantDetails)) {
      transformed.variantDetails = await Promise.all(
        transformed.variantDetails.map(variant => 
          transformS3UrlsToSigned(variant, imageFields, expiresIn)
        )
      );
    }

    return transformed;
  }

  // Si c'est une valeur simple, la retourner telle quelle
  return data;
}

module.exports = {
  getSignedUrlForS3Object,
  getSignedUrlsForS3Objects,
  transformS3UrlsToSigned,
  s3Client,
  BUCKET_NAME,
};

