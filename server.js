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
});

function initializeDb() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS recurring_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                target_frequency INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            CREATE TABLE IF NOT EXISTS today_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Tables de la base de données initialisées.");
    });
}

app.post('/api/tasks', (req, res) => {
    const { name, description, target_frequency } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Le nom de la tâche est requis' });
    }
    const query = `INSERT INTO recurring_tasks (name, description, target_frequency) VALUES (?, ?, ?)`;
    db.run(query, [name, description, target_frequency], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Une tâche avec ce nom existe déjà.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, description, target_frequency });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, target_frequency } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Le nom de la tâche est requis' });
    }
    const query = `UPDATE recurring_tasks SET name = ?, description = ?, target_frequency = ? WHERE id = ?`;
    db.run(query, [name, description, target_frequency, id], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Une tâche avec ce nom existe déjà.' });
            }
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.json({ id, name, description, target_frequency });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM recurring_tasks WHERE id = ?`, [id], function(err) {
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
    const { task_id, date, status, note } = req.body;
    if (task_id == null || date == null || status == null) {
        return res.status(400).json({ error: 'Les champs task_id, date, et status sont requis' });
    }
    const query = `
        INSERT INTO daily_validations (task_id, date, status, note)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(task_id, date) DO UPDATE SET
        status = excluded.status,
        note = excluded.note;
    `;
    db.run(query, [task_id, date, status, note], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Validation enregistrée' });
    });
});

app.delete('/api/validations', (req, res) => {
    const { task_id, date } = req.body;
    if (!task_id || !date) {
        return res.status(400).json({ error: 'Les champs task_id et date sont requis' });
    }
    db.run('DELETE FROM daily_validations WHERE task_id = ? AND date = ?', [task_id, date], function(err) {
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
    db.all(`SELECT * FROM recurring_tasks ORDER BY created_at ASC`, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(rows);
    });
});

app.get('/api/validations/range', (req, res) => {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    const query = `SELECT * FROM daily_validations WHERE date BETWEEN ? AND ?`;
    db.all(query, [start_date, end_date], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(rows);
    });
});

app.get('/api/heatmap', (req, res) => {
    const { year } = req.query;
    if (!year) {
        return res.status(400).json({ error: 'Year is required' });
    }
    const query = `
        SELECT
            date,
            SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completion_count
        FROM daily_validations
        WHERE strftime('%Y', date) = ?
        GROUP BY date
        HAVING completion_count > 0
    `;
    db.all(query, [year], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(rows);
    });
});

app.get('/api/statistics', (req, res) => {
    const stats = {};
    const taskSuccessQuery = `
        SELECT
            t.name,
            CAST(SUM(CASE WHEN dv.status = 2 THEN 1 ELSE 0 END) AS REAL) * 100 / COUNT(dv.id) as success_rate
        FROM daily_validations dv
        JOIN recurring_tasks t ON dv.task_id = t.id
        GROUP BY t.id, t.name
        HAVING COUNT(dv.id) > 0;
    `;
    db.all(taskSuccessQuery, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        stats.taskSuccess = rows;
        res.json(stats);
    });
});

// Routes pour les tâches à faire
app.post('/api/todo-tasks', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Le nom de la tâche est requis' });
    }
    
    const query = `INSERT INTO today_tasks (name) VALUES (?)`;
    db.run(query, [name], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, completed: false });
    });
});

app.get('/api/todo-tasks', (req, res) => {
    const query = `SELECT * FROM today_tasks ORDER BY created_at ASC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/api/todo-tasks/:id/toggle', (req, res) => {
    const { id } = req.params;
    
    const query = `
        UPDATE today_tasks 
        SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END 
        WHERE id = ?
    `;
    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.json({ message: 'Statut modifié' });
    });
});

app.delete('/api/todo-tasks/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM today_tasks WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        res.status(204).send();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
}); 