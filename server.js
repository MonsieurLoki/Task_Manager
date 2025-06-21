const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Base de données
const db = new sqlite3.Database('./tasks.db');

// Créer les tables si elles n'existent pas
db.serialize(() => {
  // Table des tâches récurrentes
  db.run(`CREATE TABLE IF NOT EXISTS recurring_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    target_frequency INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table des validations quotidiennes avec notes et états
  db.run(`CREATE TABLE IF NOT EXISTS daily_validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status INTEGER DEFAULT 0,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES recurring_tasks (id),
    UNIQUE(task_id, date)
  )`);
});

// Routes API

// GET /api/tasks - Récupérer toutes les tâches récurrentes avec leurs validations pour une date
app.get('/api/tasks', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    res.status(400).json({ error: 'La date est requise' });
    return;
  }

  const query = `
    SELECT 
      rt.id,
      rt.name,
      rt.target_frequency,
      v.date,
      v.status,
      v.note
    FROM 
      recurring_tasks rt
    LEFT JOIN 
      daily_validations v ON rt.id = v.task_id
    ORDER BY 
      rt.created_at DESC;
  `;

  db.all(query, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET /api/tasks/history - Récupérer l'historique des validations pour une période
app.get('/api/tasks/history', (req, res) => {
  const { start_date, end_date } = req.query;
  
  if (!start_date || !end_date) {
    res.status(400).json({ error: 'Les dates de début et fin sont requises' });
    return;
  }

  const query = `
    SELECT 
      rt.id,
      rt.name,
      rt.target_frequency,
      v.date,
      v.status,
      v.note
    FROM 
      recurring_tasks rt
    LEFT JOIN 
      daily_validations v ON rt.id = v.task_id
    WHERE 
      v.date BETWEEN ? AND ?
    ORDER BY 
      rt.created_at DESC, v.date ASC;
  `;

  db.all(query, [start_date, end_date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/tasks - Créer une nouvelle tâche récurrente
app.post('/api/tasks', (req, res) => {
  const { name, target_frequency } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Le nom de la tâche est requis.' });
  }

  const query = 'INSERT INTO recurring_tasks (name, target_frequency) VALUES (?, ?)';
  db.run(query, [name, target_frequency], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Une tâche avec ce nom existe déjà.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name, target_frequency });
  });
});

// PUT /api/tasks/:id - Modifier une tâche récurrente
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { name, target_frequency } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Le nom de la tâche est requis.' });
  }

  const query = 'UPDATE recurring_tasks SET name = ?, target_frequency = ? WHERE id = ?';
  db.run(query, [name, target_frequency, id], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Une autre tâche avec ce nom existe déjà.' });
      }
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée.' });
    }
    res.status(200).json({ message: 'Tâche mise à jour avec succès.' });
  });
});

// DELETE /api/tasks/:id - Supprimer une tâche récurrente
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  // Supprimer d'abord toutes les validations associées
  db.run('DELETE FROM daily_validations WHERE task_id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Puis supprimer la tâche
    db.run('DELETE FROM recurring_tasks WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Tâche non trouvée' });
        return;
      }
      
      res.json({ message: 'Tâche supprimée avec succès' });
    });
  });
});

// POST /api/tasks/:id/validate - Valider une tâche pour une date avec statut et note
app.post('/api/tasks/:id/validate', (req, res) => {
  const { id } = req.params;
  const { date, status, note } = req.body;
  
  if (!date || status === undefined) {
    res.status(400).json({ error: 'La date et le statut sont requis' });
    return;
  }

  // Vérifier si la tâche existe
  db.get('SELECT id FROM recurring_tasks WHERE id = ?', [id], (err, task) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!task) {
      res.status(404).json({ error: 'Tâche non trouvée' });
      return;
    }

    // Insérer ou mettre à jour la validation
    const query = `
      INSERT OR REPLACE INTO daily_validations (task_id, date, status, note) 
      VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [id, date, status, note || null], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ 
        message: 'Validation mise à jour avec succès',
        task_id: id,
        date: date,
        status: status,
        note: note
      });
    });
  });
});

  // DELETE a specific task validation
app.delete('/api/tasks/:taskId/validate', (req, res) => {
    const { taskId } = req.params;
    const { date } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    db.run('DELETE FROM daily_validations WHERE task_id = ? AND date = ?', [taskId, date], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Validation not found' });
        }
        res.status(200).json({ message: 'Validation deleted successfully' });
    });
});

// Route pour servir l'application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Accédez à l'application: http://localhost:${PORT}`);
}); 