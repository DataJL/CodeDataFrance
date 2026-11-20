/**
 * Données et texte intégral du Guide Hébergement & Diffusion Gratuite des Bilans FFA (GitHub & Cloudflare R2)
 */

export const CLOUD_STORAGE_GUIDE_MARKDOWN = `# Guide Complet : Hébergement & Diffusion Gratuite des Fichiers Bilans FFA
### Pour l'application Stats France Athlé — Solutions GitHub & Cloudflare R2

---

## 1. Introduction : Pourquoi éviter Firestore pour les fichiers bilans ?

Dans les bases de données NoSQL cloud comme Firebase Firestore, chaque performance individuelle stockée compte comme une **unité d'écriture**.
- Une saison d'athlétisme française représente entre **40 000 et 100 000 performances**.
- Le quota gratuit de Firebase Firestore autorise **20 000 écritures par jour** au maximum.
- Par conséquent, importer une seule saison sature immédiatement le quota Firestore et bloque la base (\`FirebaseError: [code=resource-exhausted]: Quota limit exceeded\`).

### La solution moderne et pérenne
Au lieu d'écrire des dizaines de milliers de lignes dans une base payante ou limitée, la solution standard pour les données d'athlétisme consiste à :
1. **Héberger les fichiers CSV officiels bruts** sur un serveur de stockage gratuit et illimité en bande passante (**GitHub** ou **Cloudflare R2**).
2. **Laisser le navigateur de chaque utilisateur télécharger le fichier CSV** en 1 seule requête HTTP.
3. **L'application locale (React + Web Workers) analyse le fichier et l'enregistre dans IndexedDB** (la base de données locale du navigateur du visiteur).

**Résultat :**
- **0 € de coût** pour l'hébergement et la diffusion.
- **Aucune limite de quota d'écriture**.
- **Chargement ultra-rapide** (quelques secondes pour 60 000 performances).
- **Fonctionnement hors-ligne** une fois le bilan chargé sur le poste de l'utilisateur.

---

## 2. Solution 1 : GitHub (100% Gratuit, 0 Serveur)

GitHub offre deux manières simples et gratuites d'héberger vos fichiers bilans.

### Méthode A : GitHub Releases (Fortement Recommandée)
Cette méthode est la plus simple et la plus robuste. Elle permet d'attacher des fichiers pesant jusqu'à **2 Go par fichier**, sans alourdir l'historique Git.

#### Étape 1 : Créer un compte et un dépôt public
1. Rendez-vous sur https://github.com et créez un compte gratuit (si vous n'en avez pas).
2. Cliquez sur **New repository** (Nouveau dépôt).
3. Nommez-le par exemple : \`stats-france-athle-data\`.
4. Cochez **Public** (important pour que les fichiers soient accessibles sans authentification).
5. Cochez **Add a README file** puis cliquez sur **Create repository**.

#### Étape 2 : Créer une Release (Version)
1. Sur la page d'accueil de votre dépôt GitHub, cliquez sur **Releases** dans la colonne de droite (ou sur l'onglet *Tags*).
2. Cliquez sur **Draft a new release** (Créer une version).
3. Dans le champ **Choose a tag**, écrivez par exemple : \`v2025-2026\` (ou \`saison-2025-2026\`) et cliquez sur *Create new tag*.
4. Dans **Release title**, saisissez : \`Bilans Officiels FFA 2025-2026\`.
5. Dans la zone **Attach binaries by dropping them here or selecting them**, glissez-déposez vos fichiers bilans officiels :
   - \`Rslts_salle_25-26.csv\`
   - \`Rslts_PISTE_25-26.csv\`
   *(Conseil : évitez les espaces dans les noms de fichiers, préférez des tirets du bas \`_\` ou tirets \`-\`)*.
6. Cliquez sur **Publish release** (Publier la release).

#### Étape 3 : Récupérer l'URL de téléchargement direct
Une fois publiée, chaque fichier dispose d'un lien public direct sous la forme :
\`\`\`
https://github.com/<VOTRE_NOM_UTILISATEUR>/<VOTRE_DEPOT>/releases/download/<TAG>/<NOM_FICHIER>.csv
\`\`\`

*Exemple concret :*
\`\`\`
https://github.com/monclub/stats-france-athle-data/releases/download/v2025-2026/Rslts_salle_25-26.csv
\`\`\`
> **Astuce :** Faites un clic-droit sur le fichier dans la page de la release GitHub et choisissez **"Copier l'adresse du lien"**. Cette URL peut être directement collée dans Stats France Athlé !

---

### Méthode B : Dépôt Git & GitHub Raw (Fichiers < 25-50 Mo)
Si vos fichiers font moins de 25 Mo, vous pouvez les téléverser directement dans les dossiers du dépôt GitHub.

1. Dans votre dépôt public GitHub, cliquez sur **Add file** > **Upload files**.
2. Glissez-déposez votre fichier (ex: \`data/Rslts_salle_25-26.csv\`).
3. Cliquez sur **Commit changes**.
4. Ouvrez le fichier sur GitHub, puis cliquez sur le bouton **Raw** en haut à droite.
5. Copiez l'URL de la barre d'adresse de votre navigateur. Elle ressemble à :
\`\`\`
https://raw.githubusercontent.com/<VOTRE_NOM_UTILISATEUR>/<VOTRE_DEPOT>/main/data/Rslts_salle_25-26.csv
\`\`\`
Cette URL sert le fichier CSV pur et est directement téléchargeable par l'application.

---

## 3. Solution 2 : Cloudflare R2 (Stockage Objet Haute Performance)

### Pourquoi Cloudflare R2 plutôt qu'Amazon S3 ?
Cloudflare R2 est un stockage d'objets compatible avec l'API Amazon S3, mais avec un avantage exceptionnel :
- **0 € de frais de bande passante sortante (Zero egress fees)** : vous ne payez jamais pour le téléchargement des fichiers par vos utilisateurs, même s'ils téléchargent des centaines de gigaoctets.
- **Gratuit jusqu'à 10 Go de stockage** par mois.
- **10 millions de requêtes de lecture gratuites** par mois.
- Réseau CDN mondial ultra-rapide de Cloudflare.

### Tutoriel pas à pas : Cloudflare R2

#### Étape 1 : Créer votre compte Cloudflare
1. Rendez-vous sur https://dash.cloudflare.com et créez un compte gratuit.
2. Dans le menu de gauche, cliquez sur **R2 Object Storage**.
3. Activez R2 (Cloudflare demande un moyen de paiement de vérification de compte, mais le plan gratuit R2 inclut 10 Go et 10 millions de requêtes sans facturation).

#### Étape 2 : Créer un Bucket (Dossier de stockage)
1. Cliquez sur **Create bucket**.
2. Donnez un nom à votre bucket (ex: \`athle-bilans-public\`).
3. Choisissez l'emplacement **Automatic** ou **Western Europe (WEUR)** pour une vitesse maximale en France.
4. Cliquez sur **Create bucket**.

#### Étape 3 : Téléverser vos fichiers bilans
1. Dans l'onglet **Objects** de votre bucket, cliquez sur **Upload** > **Upload files**.
2. Sélectionnez vos fichiers CSV officiels (\`Rslts_salle_25-26.csv\`, etc.).
3. Cliquez sur **Upload**.

#### Étape 4 : Rendre le bucket public
1. Allez dans l'onglet **Settings** de votre bucket.
2. Faites défiler jusqu'à la section **Public access**.
3. Dans la sous-section **R2.dev subdomain**, cliquez sur **Allow Access** (ou liez votre propre nom de domaine personnalisé si vous en possédez un).
4. Cloudflare génère une URL publique pour votre bucket, par exemple :
   \`https://pub-a1b2c3d4e5f6.r2.dev\`
5. L'URL directe de votre fichier bilan devient :
   \`https://pub-a1b2c3d4e5f6.r2.dev/Rslts_salle_25-26.csv\`

---

### Configuration CORS (INDISPENSABLE pour Cloudflare R2)

Par sécurité, les navigateurs web interdisent à une application web de télécharger des fichiers depuis un autre domaine sans autorisation explicite (**CORS - Cross-Origin Resource Sharing**).

Pour que Stats France Athlé puisse télécharger vos fichiers depuis Cloudflare R2 :
1. Dans Cloudflare, ouvrez votre bucket R2, puis allez dans **Settings**.
2. Descendez à la section **CORS Policy** (Règles CORS) et cliquez sur **Add CORS policy** ou **Edit policy**.
3. Collez exactement la configuration JSON suivante :

\`\`\`json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
\`\`\`
4. Cliquez sur **Save** (Enregistrer). Vos fichiers sont désormais téléchargeables depuis n'importe quel navigateur sans blocage CORS !

---

## 4. Tableau Comparatif : GitHub vs Cloudflare R2

| Critère | GitHub Releases / Raw | Cloudflare R2 |
| :--- | :--- | :--- |
| **Coût mensuel** | **100% Gratuit à vie** | **100% Gratuit** (jusqu'à 10 Go) |
| **Carte bancaire requise ?** | ❌ **Non** (aucun moyen de paiement) | ⚠️ Oui (pour vérification compte) |
| **Taille max par fichier** | **2 Go** par fichier (Releases) / 25 Mo (Git) | **5 To** par fichier |
| **Frais de bande passante** | 0 € (bande passante illimitée) | 0 € (zéro egress fee garanti) |
| **Configuration CORS** | Automatique sur \`raw.githubusercontent\` | 1 copier-coller de JSON dans l'interface |
| **Simplicité de mise en place** | ⭐⭐⭐⭐⭐ (5 minutes chrono) | ⭐⭐⭐⭐ (10 minutes chrono) |
| **Historique & Versions** | Excellent (système de tags par saison) | Simple stockage de fichiers |
| **Recommandation générale** | **Le plus rapide et simple à mettre en œuvre** | **Idéal si vous gérez déjà des domaines Cloudflare** |

---

## 5. Astuce Compression Gzip (.csv.gz)

Les fichiers bilans FFA sont des fichiers texte très répétitifs (codes clubs, villes, libellés d'épreuves). La compression Gzip permet d'obtenir un gain spectaculaire :

- Fichier brut \`Rslts_salle_25-26.csv\` : **~18 Mo**
- Fichier compressé \`Rslts_salle_25-26.csv.gz\` : **~2,4 Mo** (soit **87% de réduction** !)

### Comment compresser facilement :
- **Sous Windows** : Avec le logiciel gratuit [7-Zip](https://www.7-zip.org/), faites un clic-droit sur le fichier CSV > *7-Zip* > *Ajouter à l'archive...* > Format de l'archive : \`gzip\`.
- **Sous Mac / Linux** : Ouvrez le terminal et tapez :
  \`\`\`bash
  gzip -k "Rslts salle 25-26.csv"
  \`\`\`
  Cela génère directement \`Rslts salle 25-26.csv.gz\`.

---

## 6. Utilisation dans l'Application Stats France Athlé

Grâce au module intégré dans l'onglet **Import / Export** de Stats France Athlé :

1. Ouvrez l'onglet **Import / Export**.
2. Dans la section **"Importer depuis une URL distante"**, collez l'URL directe de votre fichier (GitHub Releases, GitHub Raw ou Cloudflare R2).
3. Sélectionnez la saison (ex: \`2025-2026\`) et l'environnement (\`En Salle\`, \`Plein Air\` ou \`Plein air + salle\`).
4. Cliquez sur **"Télécharger et Intégrer"**.
5. L'application télécharge le fichier en arrière-plan, extrait les 27 colonnes FFA Logica/SIFFA, calcule les statistiques et stocke le résultat dans le navigateur de l'utilisateur (IndexedDB).
6. Les données restent instantanément disponibles, même hors-ligne, sans jamais consommer de quota payant !
`;

export const CLOUD_STORAGE_CORS_JSON = `[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]`;
