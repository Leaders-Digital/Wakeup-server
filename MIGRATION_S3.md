# Migration vers Amazon S3

Ce document décrit la migration du système d'upload de fichiers de Multer (stockage local) vers Amazon S3.

## Configuration requise

### Variables d'environnement

Ajoutez les variables suivantes à votre fichier `.env` :

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

**Note pour les Access Points S3 :** Si vous utilisez un Access Point S3 avec un alias, vous pouvez utiliser l'alias directement comme nom de bucket :

```env
AWS_S3_BUCKET_NAME=backend-uhagn6yhco54xw6r5zg14gm9at6nneun1a-s3alias
```

Ou utiliser l'ARN complet de l'Access Point :

```env
AWS_S3_BUCKET_NAME=arn:aws:s3:region:account-id:accesspoint/alias/access-point-alias
```

### Configuration du bucket S3

1. Créez un bucket S3 dans votre compte AWS
2. Configurez les permissions CORS pour permettre l'accès public aux fichiers :
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
3. Configurez la politique du bucket pour permettre la lecture publique :
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

## Changements effectués

### Middleware

- **`Middleware/s3Upload.js`** : Nouveau middleware pour les uploads S3 avec configuration personnalisée
- **`Middleware/s3UploadSimple.js`** : Middleware S3 simple pour les uploads basiques
- **`Middleware/imageUpload.js`** : Maintenant utilise S3 au lieu du stockage local
- **`Middleware/upload.js`** : Maintenant utilise S3 au lieu du stockage local

### Contrôleurs

Tous les contrôleurs ont été mis à jour pour utiliser `req.file.location` (URL S3) au lieu de `req.file.path` (chemin local) :

- `Controllers/Produit.controller.js`
- `Controllers/banner.controller.js`
- `Controllers/Partenaire.controller.js`
- `Controllers/Blog.controller.js`

### Routes

Les routes ont été mises à jour pour utiliser les nouveaux dossiers S3 :

- **Products** : `products/`
- **Banners** : `banners/`
- **Blog** : `blog/`
- **Partenaires** : `partenaires/`

## Utilisation

### Upload simple

```javascript
const upload = require('./Middleware/upload');
router.post('/upload', upload.single('file'), controller);
// Accès : req.file.location (URL S3)
```

### Upload avec configuration personnalisée

```javascript
const { uploadFile } = require('./Middleware/imageUpload');
router.post('/upload', uploadFile({
  folder: "products",
  acceptedTypes: [".png", ".jpeg", ".jpg"],
  fieldName: "mainPicture",
  multiple: false,
}), controller);
// Accès : req.file.location (URL S3)
```

### Upload multiple

```javascript
const { uploadFile } = require('./Middleware/imageUpload');
router.post('/upload', uploadFile({
  folder: "products",
  acceptedTypes: [".png", ".jpeg", ".jpg"],
  fieldName: "pictures",
  multiple: true,
  maxCount: 5,
}), controller);
// Accès : req.files[0].location, req.files[1].location, etc.
```

## Notes importantes

1. **URLs publiques** : Les fichiers uploadés sur S3 sont accessibles publiquement via leur URL
2. **Anciens fichiers** : Les fichiers stockés localement dans le dossier `uploads/` ne sont plus utilisés. Vous pouvez les migrer vers S3 si nécessaire
3. **Compatibilité** : Le middleware `express.static("uploads")` dans `index.js` est conservé pour la compatibilité avec les anciens fichiers, mais n'est plus nécessaire pour les nouveaux uploads

## URLs Signées (Presigned URLs)

Depuis la migration, le système utilise des **URLs signées** (presigned URLs) avec Signature Version 4 pour accéder aux images S3. Cela permet d'accéder aux objets S3 même s'ils ne sont pas publics.

### Comment ça fonctionne

1. **Génération automatique** : Les URLs S3 stockées en base de données sont automatiquement transformées en URLs signées lors de la récupération des données via les API.

2. **Durée de validité** : Les URLs signées sont valides pendant 1 heure (3600 secondes) par défaut.

3. **Transformation automatique** : La fonction `transformS3UrlsToSigned()` dans `helpers/s3Helper.js` transforme automatiquement :
   - Les champs d'images dans les produits (`mainPicture`, `picture`, `icon`)
   - Les variants et variantDetails
   - Les images de blog (`blogImage`)
   - Les bannières (`picture`)
   - Les logos de partenaires (`logo`)

### Utilisation

Les contrôleurs suivants ont été mis à jour pour utiliser automatiquement les URLs signées :
- `Controllers/Produit.controller.js` - Toutes les fonctions de récupération de produits
- `Controllers/Blog.controller.js` - Récupération d'articles
- `Controllers/banner.controller.js` - Récupération de bannières
- `Controllers/Partenaire.controller.js` - Récupération de partenaires

### Package requis

Le package `@aws-sdk/s3-request-presigner` a été ajouté pour générer les URLs signées.

## Dépannage

### Erreur : "Access Denied" ou "The authorization mechanism you have provided is not supported"
- **Solution** : Les URLs sont maintenant automatiquement transformées en URLs signées. Vérifiez que :
  - Le package `@aws-sdk/s3-request-presigner` est installé
  - Les credentials AWS sont corrects dans `.env`
  - Le bucket/access point existe et est accessible

### Erreur : "Bucket does not exist"
- Vérifiez que le nom du bucket dans `.env` est correct
- Vérifiez que le bucket existe dans la région spécifiée

### Les images ne s'affichent toujours pas
- Vérifiez les logs du serveur pour voir les erreurs de génération d'URLs signées
- Vérifiez que les URLs S3 stockées en base de données sont correctes
- Vérifiez que les credentials AWS ont les permissions `s3:GetObject` sur le bucket/access point

