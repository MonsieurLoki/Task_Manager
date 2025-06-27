# 🚀 Guide de Déploiement - Task Manager

## 📋 Prérequis

- Compte GitHub
- Compte Supabase
- Compte Vercel (recommandé) ou autre plateforme de déploiement

## 🔧 Configuration Supabase

### 1. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et vos clés API

### 2. Configurer l'authentification
1. Dans votre dashboard Supabase, allez dans "Authentication" > "Settings"
2. Activez "Enable email confirmations"
3. Configurez les URLs de redirection :
   - `https://your-app.vercel.app/auth.html`
   - `https://your-app.vercel.app/`

### 3. Créer les tables
Exécutez le script de migration :
```bash
npm install
node migrate-to-supabase.js
```

## 🌐 Déploiement sur Vercel

### 1. Préparer le repository
1. Poussez votre code sur GitHub
2. Assurez-vous que tous les fichiers sont commités

### 2. Connecter Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez votre compte GitHub
3. Importez votre repository

### 3. Configurer les variables d'environnement
Dans les paramètres de votre projet Vercel, ajoutez :

```
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase
NODE_ENV=production
VAPID_PUBLIC_KEY=votre_cle_publique_vapid
VAPID_PRIVATE_KEY=votre_cle_privee_vapid
```

### 4. Déployer
1. Cliquez sur "Deploy"
2. Attendez que le déploiement se termine
3. Votre app sera disponible à `https://your-app.vercel.app`

## 🔒 Sécurité

### Variables d'environnement à protéger
- `SUPABASE_SERVICE_ROLE_KEY` : Clé privée Supabase
- `VAPID_PRIVATE_KEY` : Clé privée VAPID
- `SESSION_SECRET` : Clé de session (si utilisée)

### Bonnes pratiques
- Ne jamais commiter les fichiers `.env`
- Utiliser HTTPS en production
- Configurer les CORS correctement
- Limiter les permissions des clés API

## 📊 Monitoring

### Logs
- Vercel : Dashboard > Functions > Logs
- Supabase : Dashboard > Logs

### Métriques
- Performance : Vercel Analytics
- Base de données : Supabase Dashboard

## 🔄 Mises à jour

### Déploiement automatique
- Chaque push sur la branche `main` déclenche un nouveau déploiement
- Les variables d'environnement sont conservées

### Rollback
- Dans Vercel : Dashboard > Deployments > Revert

## 🆘 Dépannage

### Erreurs courantes
1. **Variables d'environnement manquantes** : Vérifiez la configuration Vercel
2. **Erreurs CORS** : Configurez les origines autorisées dans Supabase
3. **Base de données non accessible** : Vérifiez les permissions Supabase

### Support
- Vercel : [vercel.com/support](https://vercel.com/support)
- Supabase : [supabase.com/support](https://supabase.com/support)

## 🎉 Félicitations !

Votre Task Manager est maintenant en production ! 🚀 