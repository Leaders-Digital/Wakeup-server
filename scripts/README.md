# Scripts de Migration

## Migration vers S3

Ce script migre tous les fichiers du dossier `uploads/` vers Amazon S3 en conservant la même structure de dossiers.

### Prérequis

1. Assurez-vous que votre fichier `.env` contient toutes les variables nécessaires :
   ```env
   AWS_REGION=eu-north-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_S3_BUCKET_NAME=your-bucket-name-or-access-point-alias
   Mongo_URI=your-mongodb-connection-string
   ```

2. Vérifiez que vous avez les permissions nécessaires pour :
   - Lire les fichiers du dossier `uploads/`
   - Écrire sur votre bucket S3
   - Modifier les documents dans votre base de données MongoDB

### Utilisation

Exécutez la migration avec :

```bash
npm run migrate:s3
```

Ou directement :

```bash
node scripts/migrateToS3.js
```

### Ce que fait le script

1. **Scanne récursivement** le dossier `uploads/` pour trouver tous les fichiers
2. **Convertit automatiquement les images en WebP** (JPG, PNG, GIF, etc.) pour optimiser la taille et les performances
3. **Upload chaque fichier** sur S3 en conservant la structure de dossiers (ex: `uploads/products/file.jpg` → `products/file.webp` sur S3)
4. **Met à jour automatiquement** toutes les références dans la base de données :
   - `Product.mainPicture`
   - `Variant.picture` et `Variant.icon`
   - `Banner.picture`
   - `Blog.blogImage`
   - `Partenaire.logo`

### Structure conservée

La structure de dossiers est conservée, mais les images sont converties en WebP :
- `uploads/products/file.jpg` → `products/file.webp` sur S3
- `uploads/banners/file.png` → `banners/file.webp` sur S3
- `uploads/file.jpg` → `uploads/file.webp` sur S3
- Les fichiers non-images (PDF, Excel, etc.) sont uploadés tels quels

### Notes importantes

- ⚠️ **Sauvegardez votre base de données** avant d'exécuter la migration
- 📸 **Conversion WebP** : Toutes les images (JPG, PNG, GIF, BMP, TIFF) sont automatiquement converties en WebP avec une qualité de 85% pour optimiser la taille des fichiers
- Le script traite les fichiers par lots de 10 pour éviter de surcharger le système
- Les fichiers locaux ne sont **pas supprimés** automatiquement (vous pouvez les supprimer manuellement après vérification)
- Le script affiche un résumé détaillé à la fin de la migration
- Les nouveaux uploads via l'API sont également automatiquement convertis en WebP

### Résolution de problèmes

Si vous rencontrez des erreurs :
1. Vérifiez que toutes les variables d'environnement sont correctement configurées
2. Vérifiez vos credentials AWS
3. Vérifiez que votre bucket S3 existe et que vous avez les permissions nécessaires
4. Vérifiez votre connexion MongoDB

