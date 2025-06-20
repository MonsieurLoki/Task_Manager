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

// Créer la table des tâches si elle n'existe pas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Routes API

// GET /api/tasks - Récupérer toutes les tâches
app.get('/api/tasks', (req, res) => {
  const { date } = req.query;
  let query = 'SELECT * FROM tasks';
  let params = [];

  if (date) {
    query += ' WHERE date = ?';
    params.push(date);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/tasks - Créer une nouvelle tâche
app.post('/api/tasks', (req, res) => {
  const { title, description, date } = req.body;
  
  if (!title || !date) {
    res.status(400).json({ error: 'Le titre et la date sont requis' });
    return;
  }

  const query = 'INSERT INTO tasks (title, description, date) VALUES (?, ?, ?)';
  db.run(query, [title, description, date], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Récupérer la tâche créée
    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(row);
    });
  });
});

// PUT /api/tasks/:id - Modifier une tâche
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, date, completed } = req.body;

  const query = 'UPDATE tasks SET title = ?, description = ?, date = ?, completed = ? WHERE id = ?';
  db.run(query, [title, description, date, completed ? 1 : 0, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Tâche non trouvée' });
      return;
    }
    
    // Récupérer la tâche mise à jour
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });
});

// DELETE /api/tasks/:id - Supprimer une tâche
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
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

// Route pour servir l'application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Accédez à l'application: http://localhost:${PORT}`);
}); 