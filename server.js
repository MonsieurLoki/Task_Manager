const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = 'tasks.db';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database(path, (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connecté à la base de données SQLite.');
    initializeDb();
    migrateDb();
});

function initializeDb() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS recurring_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                target_frequency INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS daily_validations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                date TEXT,
                status INTEGER,
                note TEXT,
                FOREIGN KEY(task_id) REFERENCES recurring_tasks(id) ON DELETE CASCADE,
                UNIQUE(task_id, date)
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS todo_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Tables de la base de données initialisées.");
    });
}

function migrateDb() {
    db.serialize(() => {
        // Ajout de user_id à recurring_tasks si absent
        db.get("PRAGMA table_info(recurring_tasks)", (err, row) => {
            db.all("PRAGMA table_info(recurring_tasks)", (err, columns) => {
                if (!columns.some(col => col.name === 'user_id')) {
                    db.run(`ALTER TABLE recurring_tasks ADD COLUMN user_id INTEGER`);
                }
            });
        });
        // Ajout de user_id à daily_validations si absent
        db.all("PRAGMA table_info(daily_validations)", (err, columns) => {
            if (!columns.some(col => col.name === 'user_id')) {
                db.run(`ALTER TABLE daily_validations ADD COLUMN user_id INTEGER`);
            }
        });
        // Migration de la contrainte UNIQUE sur daily_validations
        db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_validations'", (err, row) => {
            if (row && row.sql && row.sql.includes('UNIQUE(task_id, date)') && !row.sql.includes('user_id')) {
                // Pour SQLite, il faut recréer la table pour changer la contrainte UNIQUE
                db.serialize(() => {
                    db.run(`CREATE TABLE IF NOT EXISTS daily_validations_tmp (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        task_id INTEGER,
                        date TEXT,
                        status INTEGER,
                        note TEXT,
                        user_id INTEGER,
                        FOREIGN KEY(task_id) REFERENCES recurring_tasks(id) ON DELETE CASCADE,
                        UNIQUE(task_id, date, user_id)
                    )`);
                    db.run(`INSERT OR IGNORE INTO daily_validations_tmp (id, task_id, date, status, note, user_id)
                        SELECT id, task_id, date, status, note, user_id FROM daily_validations`);
                    db.run(`DROP TABLE daily_validations`);
                    db.run(`ALTER TABLE daily_validations_tmp RENAME TO daily_validations`);
                });
            }
        });
    });
}

app.post('/api/tasks', (req, res) => {
    const { name, description, target_frequency, user_id } = req.body;
    if (!name || !user_id) {
        return res.status(400).json({ error: 'Le nom de la tâche et l\'utilisateur sont requis' });
    }
    const query = `INSERT INTO recurring_tasks (name, description, target_frequency, user_id) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, description, target_frequency, user_id], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Une tâche avec ce nom existe déjà.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, description, target_frequency, user_id });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, target_frequency, user_id } = req.body;
    if (!name || !user_id) {
        return res.status(400).json({ error: 'Le nom de la tâche et l\'utilisateur sont requis' });
    }
    const query = `UPDATE recurring_tasks SET name = ?, description = ?, target_frequency = ? WHERE id = ? AND user_id = ?`;
    db.run(query, [name, description, target_frequency, id, user_id], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Une tâche avec ce nom existe déjà.' });
            }
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.json({ id, name, description, target_frequency, user_id });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) {
        return res.status(400).json({ error: 'Utilisateur requis' });
    }
    db.run(`DELETE FROM recurring_tasks WHERE id = ? AND user_id = ?`, [id, user_id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.status(204).send();
    });
});

app.post('/api/validations', (req, res) => {
    const { task_id, date, status, note, user_id } = req.body;
    if (task_id == null || date == null || status == null || !user_id) {
        return res.status(400).json({ error: 'Les champs task_id, date, status et user_id sont requis' });
    }
    const query = `
        INSERT INTO daily_validations (task_id, date, status, note, user_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(task_id, date, user_id) DO UPDATE SET
        status = excluded.status,
        note = excluded.note;
    `;
    db.run(query, [task_id, date, status, note, user_id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Validation enregistrée' });
    });
});

app.delete('/api/validations', (req, res) => {
    const { task_id, date, user_id } = req.body;
    if (!task_id || !date || !user_id) {
        return res.status(400).json({ error: 'Les champs task_id, date et user_id sont requis' });
    }
    db.run('DELETE FROM daily_validations WHERE task_id = ? AND date = ? AND user_id = ?', [task_id, date, user_id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Validation non trouvée' });
        }
        res.status(204).send();
    });
});

app.get('/api/tasks', (req, res) => {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'Utilisateur requis' });
    db.all(`SELECT * FROM recurring_tasks WHERE user_id = ? ORDER BY created_at ASC`, [user_id], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(rows);
    });
});

app.get('/api/validations/range', (req, res) => {
    const { start_date, end_date, user_id } = req.query;
    if (!start_date || !end_date || !user_id) {
        return res.status(400).json({ error: 'Les dates de début, de fin et user_id sont requis' });
    }
    const query = `SELECT * FROM daily_validations WHERE date BETWEEN ? AND ? AND user_id = ?`;
    db.all(query, [start_date, end_date, user_id], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(rows);
    });
});

app.get('/api/heatmap', (req, res) => {
    const { year, user_id } = req.query;
    if (!year || !user_id) {
        return res.status(400).json({ error: 'Year et user_id sont requis' });
    }
    const query = `
        SELECT
            date,
            SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completion_count
        FROM daily_validations
        WHERE strftime('%Y', date) = ? AND user_id = ?
        GROUP BY date
        HAVING completion_count > 0
    `;
    db.all(query, [year, user_id], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(rows);
    });
});

app.get('/api/statistics', (req, res) => {
    const user_id = req.query.user_id;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    if (!user_id || !start_date || !end_date) return res.status(400).json({ error: 'user_id, start_date et end_date requis' });
    const stats = {};
    // Sélectionne uniquement les tâches avec un objectif
    const tasksQuery = `SELECT id, name, target_frequency FROM recurring_tasks WHERE user_id = ? AND target_frequency > 0`;
    db.all(tasksQuery, [user_id], (err, tasks) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (!tasks.length) return res.json({ taskSuccess: [] });
        // Pour chaque tâche, compter les validations status=2 sur la période
        const placeholders = tasks.map(() => '?').join(',');
        const taskIds = tasks.map(t => t.id);
        const validationsQuery = `
            SELECT task_id, date, status
            FROM daily_validations
            WHERE user_id = ?
              AND task_id IN (${placeholders})
              AND date BETWEEN ? AND ?
        `;
        db.all(validationsQuery, [user_id, ...taskIds, start_date, end_date], (err, validations) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            // Pour chaque tâche, calculer le %
            const result = tasks.map(task => {
                // Génère la liste des jours de la semaine
                const weekDates = [];
                let d = new Date(start_date);
                const end = new Date(end_date);
                while (d <= end) {
                    weekDates.push(d.toISOString().split('T')[0]);
                    d.setDate(d.getDate() + 1);
                }
                // Pour chaque jour, regarde si une validation status=2 existe
                let validatedDays = 0;
                weekDates.forEach(date => {
                    const v = validations.find(val => val.task_id === task.id && val.date === date && val.status === 2);
                    if (v) validatedDays++;
                });
                const percent = Math.min(100, Math.round((validatedDays / task.target_frequency) * 10000) / 100);
                return {
                    name: task.name,
                    target_frequency: task.target_frequency,
                    validated_days: validatedDays,
                    success_rate: percent
                };
            });
            stats.taskSuccess = result;
            res.json(stats);
        });
    });
});

app.get('/api/todo-tasks', (req, res) => {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'Utilisateur requis' });
    db.all('SELECT * FROM todo_tasks WHERE user_id = ? ORDER BY created_at ASC', [user_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/todo-tasks', (req, res) => {
    const { name, user_id } = req.body;
    if (!name || !user_id) return res.status(400).json({ error: 'Le nom et l\'utilisateur sont requis' });
    db.run('INSERT INTO todo_tasks (name, user_id) VALUES (?, ?)', [name, user_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name, completed: 0, user_id });
    });
});

app.put('/api/todo-tasks/:id/toggle', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'Utilisateur requis' });
    db.get('SELECT completed FROM todo_tasks WHERE id = ? AND user_id = ?', [id, user_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Tâche non trouvée' });
        const newCompleted = row.completed ? 0 : 1;
        db.run('UPDATE todo_tasks SET completed = ? WHERE id = ? AND user_id = ?', [newCompleted, id, user_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, completed: newCompleted });
        });
    });
});

app.delete('/api/todo-tasks/:id', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'Utilisateur requis' });
    db.run('DELETE FROM todo_tasks WHERE id = ? AND user_id = ?', [id, user_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Tâche non trouvée' });
        res.status(204).send();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
}); 

// server.js