# Gestionnaire de Tâches Quotidiennes

Une application web moderne et responsive pour gérer vos tâches quotidiennes récurrentes. Parfaite pour une utilisation sur PC et téléphone, elle vous permet de valider rapidement vos habitudes quotidiennes et de suivre votre progression dans le temps.

## 🚀 Fonctionnalités

- ✅ **Tâches récurrentes** : Définissez vos tâches quotidiennes une seule fois
- 📅 **Validation rapide** : Validez ou invalidez vos tâches en un clic
- 📊 **Vue historique** : Consultez votre progression sur n'importe quelle période
- 🎯 **Indicateurs visuels** : ✓ vert pour validé, ✗ rouge pour non fait
- 📱 **Interface responsive** : Fonctionne parfaitement sur PC et mobile
- 💾 **Persistance** : Vos données sont sauvegardées localement
- 🎨 **Interface moderne** : Design épuré et intuitif

## 🛠️ Installation

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner ou télécharger le projet**
   ```bash
   git clone <votre-repo>
   cd Task_Manager
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer l'application**
   ```bash
   npm start
   ```

4. **Accéder à l'application**
   Ouvrez votre navigateur et allez sur : `http://localhost:3000`

## 📱 Utilisation

### Vue Quotidienne
- **Ajouter une tâche récurrente** : Définissez vos tâches quotidiennes (ex: "Faire du sport", "Lire 30 min")
- **Validation rapide** : Cliquez sur la case à cocher pour valider/invalider une tâche
- **Navigation par date** : Consultez vos validations pour n'importe quel jour
- **Statistiques** : Suivez votre progression quotidienne

### Vue Historique
- **Sélection de période** : Choisissez une période pour voir votre historique
- **Tableau de progression** : Visualisez toutes vos validations dans un tableau
- **Indicateurs visuels** :
  - ✓ vert : Tâche validée
  - ✗ rouge : Tâche non faite
  - - gris : Pas de validation pour cette date

### Fonctionnalités principales

1. **Ajouter une tâche récurrente**
   - Remplissez le titre (obligatoire)
   - Ajoutez une description (optionnelle)
   - Cliquez sur "Ajouter la tâche"
   - La tâche apparaîtra pour tous les jours

2. **Valider une tâche**
   - Cliquez sur la case à cocher à gauche du titre
   - ✓ vert apparaît pour les tâches validées
   - ✗ rouge apparaît pour les tâches non faites
   - Cliquez à nouveau pour changer le statut

3. **Modifier une tâche**
   - Cliquez sur l'icône crayon (✏️)
   - Modifiez le titre et/ou la description
   - Sauvegardez les modifications

4. **Supprimer une tâche**
   - Cliquez sur l'icône poubelle (🗑️)
   - Confirmez la suppression
   - Toutes les validations associées seront supprimées

5. **Naviguer entre les dates**
   - Utilisez les flèches gauche/droite
   - Sélectionnez une date directement
   - Cliquez sur "Aujourd'hui" pour revenir à la date actuelle

6. **Consulter l'historique**
   - Basculez vers la "Vue Historique"
   - Sélectionnez une période
   - Cliquez sur "Charger" pour voir votre progression

## 🗄️ Base de données

L'application utilise SQLite avec deux tables principales :

### Structure de la base de données
```sql
-- Table des tâches récurrentes
CREATE TABLE recurring_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des validations quotidiennes
CREATE TABLE daily_validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES recurring_tasks (id),
    UNIQUE(task_id, date)
);
```

## 🔧 Configuration

### Variables d'environnement
- `PORT` : Port du serveur (défaut: 3000)

### Personnalisation
Vous pouvez modifier les styles dans `public/styles.css` pour adapter l'apparence à vos préférences.

## 📦 Scripts disponibles

- `npm start` : Démarre l'application en mode production
- `npm run dev` : Démarre l'application en mode développement avec rechargement automatique

## 🌐 Déploiement

### Déploiement local
L'application peut être déployée sur votre réseau local pour un accès depuis votre téléphone :

1. Trouvez l'adresse IP de votre PC
2. Modifiez le port si nécessaire
3. Accédez depuis votre téléphone via `http://VOTRE_IP:3000`

### Déploiement en ligne
L'application peut être déployée sur des plateformes comme :
- Heroku
- Vercel
- Netlify
- Railway

## 🎯 Cas d'usage

### Exemples de tâches quotidiennes
- **Sport** : "Faire 30 min d'exercice"
- **Lecture** : "Lire 20 pages"
- **Hydratation** : "Boire 2L d'eau"
- **Méditation** : "Méditer 10 min"
- **Apprentissage** : "Pratiquer l'anglais 15 min"
- **Organisation** : "Ranger mon bureau"

### Workflow quotidien
1. **Le matin** : Consultez vos tâches du jour
2. **Pendant la journée** : Validez vos tâches au fur et à mesure
3. **Le soir** : Faites un point sur votre journée
4. **En fin de semaine** : Consultez l'historique pour voir votre progression

## 🔒 Sécurité

- L'application utilise des requêtes préparées pour éviter les injections SQL
- Les entrées utilisateur sont échappées pour prévenir les attaques XSS
- Validation côté serveur et client

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Optimiser le code

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Node.js est installé et à jour
2. Assurez-vous que le port 3000 est disponible
3. Consultez les logs du serveur pour plus d'informations

---

**Développé avec ❤️ pour une meilleure productivité quotidienne** 