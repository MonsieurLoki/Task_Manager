/**
 * Script de migration des données SQLite vers Supabase
 * 
 * Ce script permet de migrer les données existantes depuis la base SQLite
 * vers la nouvelle base Supabase.
 * 
 * Utilisation :
 * 1. Configurez vos variables d'environnement Supabase
 * 2. Assurez-vous que votre base SQLite est accessible
 * 3. Exécutez : node migration-script.js
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SQLITE_DB_PATH = './tasks.db'; // Chemin vers votre base SQLite
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies dans votre fichier .env');
    process.exit(1);
}

// Initialisation des clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

console.log('🚀 Début de la migration SQLite vers Supabase...\n');

// Fonction utilitaire pour exécuter des requêtes SQLite
function querySqlite(sql, params = []) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Fonction pour créer un utilisateur de test dans Supabase
async function createTestUser() {
    console.log('📝 Création d\'un utilisateur de test...');
    
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'migration@example.com',
            password: 'migration123',
            email_confirm: true
        });

        if (error) {
            console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
            return null;
        }

        console.log('✅ Utilisateur de test créé:', data.user.email);
        return data.user;
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
        return null;
    }
}

// Fonction pour migrer les tâches récurrentes
async function migrateRecurringTasks(userId) {
    console.log('📋 Migration des tâches récurrentes...');
    
    try {
        const tasks = await querySqlite('SELECT * FROM recurring_tasks ORDER BY created_at ASC');
        
        if (tasks.length === 0) {
            console.log('ℹ️  Aucune tâche récurrente à migrer');
            return;
        }

        console.log(`📊 ${tasks.length} tâches récurrentes trouvées`);

        for (const task of tasks) {
            const { data, error } = await supabase
                .from('recurring_tasks')
                .insert({
                    user_id: userId,
                    name: task.name,
                    description: task.description,
                    target_frequency: task.target_frequency,
                    created_at: task.created_at
                })
                .select()
                .single();

            if (error) {
                console.error(`❌ Erreur lors de la migration de la tâche "${task.name}":`, error.message);
            } else {
                console.log(`✅ Tâche migrée: "${task.name}" (ID: ${data.id})`);
            }
        }

        console.log('✅ Migration des tâches récurrentes terminée\n');
    } catch (error) {
        console.error('❌ Erreur lors de la migration des tâches récurrentes:', error);
    }
}

// Fonction pour migrer les validations quotidiennes
async function migrateDailyValidations(userId) {
    console.log('📅 Migration des validations quotidiennes...');
    
    try {
        const validations = await querySqlite('SELECT * FROM daily_validations ORDER BY date ASC');
        
        if (validations.length === 0) {
            console.log('ℹ️  Aucune validation quotidienne à migrer');
            return;
        }

        console.log(`📊 ${validations.length} validations quotidiennes trouvées`);

        // Récupérer les tâches migrées pour faire correspondre les IDs
        const { data: migratedTasks } = await supabase
            .from('recurring_tasks')
            .select('id, name')
            .eq('user_id', userId);

        const taskNameToId = {};
        migratedTasks.forEach(task => {
            taskNameToId[task.name] = task.id;
        });

        let migratedCount = 0;
        let skippedCount = 0;

        for (const validation of validations) {
            // Récupérer le nom de la tâche pour faire correspondre l'ID
            const task = await querySqlite('SELECT name FROM recurring_tasks WHERE id = ?', [validation.task_id]);
            
            if (task.length === 0) {
                console.log(`⚠️  Tâche non trouvée pour la validation ID ${validation.id}, ignorée`);
                skippedCount++;
                continue;
            }

            const taskName = task[0].name;
            const newTaskId = taskNameToId[taskName];

            if (!newTaskId) {
                console.log(`⚠️  Tâche "${taskName}" non migrée, validation ignorée`);
                skippedCount++;
                continue;
            }

            const { error } = await supabase
                .from('daily_validations')
                .insert({
                    user_id: userId,
                    task_id: newTaskId,
                    date: validation.date,
                    status: validation.status,
                    note: validation.note,
                    created_at: validation.created_at || new Date().toISOString()
                });

            if (error) {
                console.error(`❌ Erreur lors de la migration de la validation du ${validation.date}:`, error.message);
            } else {
                migratedCount++;
                if (migratedCount % 10 === 0) {
                    console.log(`📈 ${migratedCount} validations migrées...`);
                }
            }
        }

        console.log(`✅ Migration des validations terminée: ${migratedCount} migrées, ${skippedCount} ignorées\n`);
    } catch (error) {
        console.error('❌ Erreur lors de la migration des validations:', error);
    }
}

// Fonction pour migrer les tâches à faire
async function migrateTodayTasks(userId) {
    console.log('📝 Migration des tâches à faire...');
    
    try {
        const tasks = await querySqlite('SELECT * FROM today_tasks ORDER BY created_at ASC');
        
        if (tasks.length === 0) {
            console.log('ℹ️  Aucune tâche à faire à migrer');
            return;
        }

        console.log(`📊 ${tasks.length} tâches à faire trouvées`);

        for (const task of tasks) {
            const { error } = await supabase
                .from('today_tasks')
                .insert({
                    user_id: userId,
                    name: task.name,
                    completed: task.completed === 1,
                    created_at: task.created_at
                });

            if (error) {
                console.error(`❌ Erreur lors de la migration de la tâche "${task.name}":`, error.message);
            } else {
                console.log(`✅ Tâche migrée: "${task.name}"`);
            }
        }

        console.log('✅ Migration des tâches à faire terminée\n');
    } catch (error) {
        console.error('❌ Erreur lors de la migration des tâches à faire:', error);
    }
}

// Fonction principale de migration
async function migrateData() {
    try {
        // Vérifier que la base SQLite existe
        const tables = await querySqlite("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('📋 Tables trouvées dans SQLite:', tables.map(t => t.name).join(', '), '\n');

        // Créer un utilisateur de test
        const testUser = await createTestUser();
        if (!testUser) {
            console.error('❌ Impossible de créer un utilisateur de test, arrêt de la migration');
            return;
        }

        // Migrer les données
        await migrateRecurringTasks(testUser.id);
        await migrateDailyValidations(testUser.id);
        await migrateTodayTasks(testUser.id);

        console.log('🎉 Migration terminée avec succès !');
        console.log('📧 Connectez-vous avec l\'utilisateur de test: migration@example.com / migration123');
        console.log('⚠️  N\'oubliez pas de changer le mot de passe après la première connexion');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    } finally {
        // Fermer les connexions
        sqliteDb.close();
        process.exit(0);
    }
}

// Démarrer la migration
migrateData(); 