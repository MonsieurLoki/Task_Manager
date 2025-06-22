# Guide de Déploiement - Task Manager avec Supabase

## Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et votre clé anonyme

### 2. Configurer la base de données

Exécutez le script SQL `supabase-setup.sql` dans l'éditeur SQL de votre projet Supabase.

Ce script crée :
- La table `recurring_tasks` pour les tâches récurrentes
- La table `daily_validations` pour les validations quotidiennes
- La table `today_tasks` pour les tâches ponctuelles
- Les politiques de sécurité (RLS) pour protéger les données

### 3. Configurer l'authentification

1. Dans votre projet Supabase, allez dans **Authentication > Settings**
2. Activez l'authentification par email
3. Configurez les redirections d'email si nécessaire

### 4. Mettre à jour la configuration

Modifiez le fichier `public/supabase-config.js` avec vos vraies valeurs :

```javascript
const SUPABASE_URL = 'VOTRE_URL_SUPABASE';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANONYME';
```

## Déploiement

### Option 1 : Déploiement local

1. Installez les dépendances :
```bash
npm install
```

2. Lancez le serveur :
```bash
npm start
```

3. Ouvrez `http://localhost:3000` dans votre navigateur

### Option 2 : Déploiement sur Vercel/Netlify

1. Uploadez vos fichiers sur Vercel ou Netlify
2. Configurez les variables d'environnement si nécessaire
3. Votre application sera accessible via l'URL fournie

## Fonctionnalités

- ✅ Authentification complète (inscription/connexion/déconnexion)
- ✅ Gestion des tâches récurrentes
- ✅ Validations quotidiennes
- ✅ Tâches ponctuelles d'aujourd'hui
- ✅ Historique et statistiques
- ✅ Calendrier heatmap
- ✅ Mode sombre/clair
- ✅ Interface responsive

## Sécurité

- Toutes les données sont protégées par Row Level Security (RLS)
- Chaque utilisateur ne peut voir que ses propres données
- Authentification sécurisée via Supabase Auth

## Support

Pour toute question ou problème, consultez la documentation Supabase ou ouvrez une issue sur GitHub. 