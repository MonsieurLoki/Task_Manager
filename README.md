# Gestionnaire de Tâches

Une application web moderne et responsive pour gérer vos tâches quotidiennes. Parfaite pour une utilisation sur PC et téléphone.

## 🚀 Fonctionnalités

- ✅ **Interface responsive** : Fonctionne parfaitement sur PC et mobile
- 📅 **Navigation par date** : Consultez vos tâches pour n'importe quel jour
- ✏️ **Gestion complète** : Ajoutez, modifiez, supprimez et validez vos tâches
- 📊 **Statistiques** : Suivez votre progression quotidienne
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

### Sur PC
- L'interface s'adapte automatiquement à la taille de votre écran
- Utilisez la souris pour toutes les interactions
- Navigation au clavier supportée (Echap pour fermer les modales)

### Sur Mobile
- L'application est optimisée pour les écrans tactiles
- Interface adaptée aux gestes mobiles
- Navigation intuitive avec les boutons de date

### Fonctionnalités principales

1. **Ajouter une tâche**
   - Remplissez le titre (obligatoire)
   - Ajoutez une description (optionnelle)
   - Cliquez sur "Ajouter une tâche"

2. **Valider une tâche**
   - Cliquez sur la case à cocher à gauche du titre
   - La tâche sera marquée comme complétée

3. **Modifier une tâche**
   - Cliquez sur l'icône crayon (✏️)
   - Modifiez le titre et/ou la description
   - Sauvegardez les modifications

4. **Supprimer une tâche**
   - Cliquez sur l'icône poubelle (🗑️)
   - Confirmez la suppression

5. **Naviguer entre les dates**
   - Utilisez les flèches gauche/droite
   - Sélectionnez une date directement
   - Cliquez sur "Aujourd'hui" pour revenir à la date actuelle

## 🗄️ Base de données

L'application utilise SQLite pour stocker les données localement. Le fichier `tasks.db` sera créé automatiquement lors du premier démarrage.

### Structure de la base de données
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
- `npm run init-db` : Initialise la base de données (optionnel)

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