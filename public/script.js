class DailyTaskManager {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.tasks = [];
        this.editingTaskId = null;
        this.currentView = 'daily'; // 'daily' ou 'history'
        
        this.initializeElements();
        this.bindEvents();
        this.loadTasks();
        this.updateDateDisplay();
        this.initializeHistoryDates();
    }

    initializeElements() {
        // Éléments de date
        this.selectedDateInput = document.getElementById('selectedDate');
        this.prevDateBtn = document.getElementById('prevDate');
        this.nextDateBtn = document.getElementById('nextDate');
        this.todayBtn = document.getElementById('todayBtn');
        this.currentDateDisplay = document.getElementById('currentDateDisplay');

        // Boutons de vue
        this.dailyViewBtn = document.getElementById('dailyViewBtn');
        this.historyViewBtn = document.getElementById('historyViewBtn');
        this.dailyView = document.getElementById('dailyView');
        this.historyView = document.getElementById('historyView');

        // Formulaire
        this.taskForm = document.getElementById('taskForm');
        this.taskTitleInput = document.getElementById('taskTitle');
        this.taskDescriptionInput = document.getElementById('taskDescription');

        // Liste des tâches
        this.tasksList = document.getElementById('tasksList');
        this.noTasksDiv = document.getElementById('noTasks');
        this.completedCountSpan = document.getElementById('completedCount');
        this.totalCountSpan = document.getElementById('totalCount');

        // Vue historique
        this.historyStartDate = document.getElementById('historyStartDate');
        this.historyEndDate = document.getElementById('historyEndDate');
        this.loadHistoryBtn = document.getElementById('loadHistoryBtn');
        this.historyTable = document.getElementById('historyTable');
        this.noHistoryDiv = document.getElementById('noHistory');

        // Modal d'édition
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editTitleInput = document.getElementById('editTitle');
        this.editDescriptionInput = document.getElementById('editDescription');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelEditBtn = document.getElementById('cancelEdit');

        // Initialiser la date sélectionnée
        this.selectedDateInput.value = this.currentDate;
    }

    bindEvents() {
        // Navigation de date
        this.prevDateBtn.addEventListener('click', () => this.changeDate(-1));
        this.nextDateBtn.addEventListener('click', () => this.changeDate(1));
        this.todayBtn.addEventListener('click', () => this.goToToday());
        this.selectedDateInput.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.loadTasks();
            this.updateDateDisplay();
        });

        // Changement de vue
        this.dailyViewBtn.addEventListener('click', () => this.switchView('daily'));
        this.historyViewBtn.addEventListener('click', () => this.switchView('history'));

        // Formulaire d'ajout
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Vue historique
        this.loadHistoryBtn.addEventListener('click', () => this.loadHistory());

        // Modal d'édition
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.editForm.addEventListener('submit', (e) => this.handleEditTask(e));

        // Fermer modal en cliquant à l'extérieur
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
        });

        // Fermer modal avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Mettre à jour les boutons
        this.dailyViewBtn.classList.toggle('active', view === 'daily');
        this.historyViewBtn.classList.toggle('active', view === 'history');
        
        // Afficher/masquer les vues
        this.dailyView.style.display = view === 'daily' ? 'grid' : 'none';
        this.historyView.style.display = view === 'history' ? 'grid' : 'none';
        
        if (view === 'history') {
            this.loadHistory();
        }
    }

    initializeHistoryDates() {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        
        this.historyStartDate.value = lastWeek.toISOString().split('T')[0];
        this.historyEndDate.value = today.toISOString().split('T')[0];
    }

    async loadTasks() {
        try {
            const response = await fetch(`/api/tasks?date=${this.currentDate}`);
            if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
            
            this.tasks = await response.json();
            this.renderTasks();
            this.updateStats();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement des tâches', 'error');
        }
    }

    async loadHistory() {
        const startDate = this.historyStartDate.value;
        const endDate = this.historyEndDate.value;
        
        if (!startDate || !endDate) {
            this.showNotification('Veuillez sélectionner une période', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/tasks/history?start_date=${startDate}&end_date=${endDate}`);
            if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
            
            const historyData = await response.json();
            this.renderHistory(historyData, startDate, endDate);
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement de l\'historique', 'error');
        }
    }

    renderHistory(historyData, startDate, endDate) {
        if (historyData.length === 0) {
            this.historyTable.style.display = 'none';
            this.noHistoryDiv.style.display = 'block';
            return;
        }

        this.historyTable.style.display = 'block';
        this.noHistoryDiv.style.display = 'none';

        // Grouper les données par tâche
        const tasksMap = new Map();
        historyData.forEach(item => {
            if (!tasksMap.has(item.id)) {
                tasksMap.set(item.id, {
                    id: item.id,
                    title: item.title,
                    validations: []
                });
            }
            if (item.date) {
                tasksMap.get(item.id).validations.push({
                    date: item.date,
                    completed: item.completed
                });
            }
        });

        // Générer les dates de la période
        const dates = this.generateDateRange(startDate, endDate);
        
        // Créer le tableau HTML
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Tâche</th>
                        ${dates.map(date => `<th>${this.formatDateForTable(date)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        tasksMap.forEach(task => {
            tableHTML += `<tr>
                <td class="task-name">${this.escapeHtml(task.title)}</td>
                ${dates.map(date => {
                    const validation = task.validations.find(v => v.date === date);
                    if (!validation) {
                        return '<td class="status-cell"><span class="status-indicator empty">-</span></td>';
                    }
                    const statusClass = validation.completed ? 'completed' : 'not-done';
                    const statusText = validation.completed ? '✓' : '✗';
                    return `<td class="status-cell"><span class="status-indicator ${statusClass}">${statusText}</span></td>`;
                }).join('')}
            </tr>`;
        });

        tableHTML += '</tbody></table>';
        this.historyTable.innerHTML = tableHTML;
    }

    generateDateRange(startDate, endDate) {
        const dates = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }

    formatDateForTable(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }

    async handleAddTask(e) {
        e.preventDefault();
        
        const title = this.taskTitleInput.value.trim();
        const description = this.taskDescriptionInput.value.trim();
        
        if (!title) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description
                })
            });

            if (!response.ok) throw new Error('Erreur lors de l\'ajout de la tâche');
            
            const newTask = await response.json();
            this.tasks.push(newTask);
            this.renderTasks();
            this.updateStats();
            
            // Réinitialiser le formulaire
            this.taskForm.reset();
            this.showNotification('Tâche récurrente ajoutée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de l\'ajout de la tâche', 'error');
        }
    }

    async handleEditTask(e) {
        e.preventDefault();
        
        const title = this.editTitleInput.value.trim();
        const description = this.editDescriptionInput.value.trim();
        
        if (!title) return;

        try {
            const response = await fetch(`/api/tasks/${this.editingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description
                })
            });

            if (!response.ok) throw new Error('Erreur lors de la modification de la tâche');
            
            const updatedTask = await response.json();
            const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], title: updatedTask.title, description: updatedTask.description };
                this.renderTasks();
            }
            
            this.closeModal();
            this.showNotification('Tâche modifiée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la modification de la tâche', 'error');
        }
    }

    async toggleTaskValidation(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = !task.completed;

        try {
            const response = await fetch(`/api/tasks/${taskId}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: this.currentDate,
                    completed: newStatus
                })
            });

            if (!response.ok) throw new Error('Erreur lors de la validation de la tâche');
            
            // Mettre à jour localement
            task.completed = newStatus;
            this.renderTasks();
            this.updateStats();
            
            const statusText = newStatus ? 'validée' : 'invalidée';
            this.showNotification(`Tâche ${statusText} avec succès`, 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la validation de la tâche', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche récurrente ? Toutes les validations seront également supprimées.')) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression de la tâche');
            
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            this.updateStats();
            this.showNotification('Tâche supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la suppression de la tâche', 'error');
        }
    }

    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        this.editTitleInput.value = task.title;
        this.editDescriptionInput.value = task.description || '';
        this.editModal.classList.add('show');
        this.editTitleInput.focus();
    }

    closeModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        this.editForm.reset();
    }

    renderTasks() {
        if (this.tasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.noTasksDiv.style.display = 'block';
            return;
        }

        this.tasksList.style.display = 'block';
        this.noTasksDiv.style.display = 'none';

        this.tasksList.innerHTML = this.tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : 'not-done'}" 
                         onclick="taskManager.toggleTaskValidation(${task.id})" 
                         title="${task.completed ? 'Cliquer pour invalider' : 'Cliquer pour valider'}">
                    </div>
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-actions">
                    <button class="action-btn edit" onclick="taskManager.openEditModal(${task.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="taskManager.deleteTask(${task.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const completed = this.tasks.filter(t => t.completed).length;
        const total = this.tasks.length;
        
        this.completedCountSpan.textContent = completed;
        this.totalCountSpan.textContent = total;
    }

    updateDateDisplay() {
        const date = new Date(this.currentDate);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        this.currentDateDisplay.textContent = date.toLocaleDateString('fr-FR', options);
    }

    changeDate(days) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + days);
        this.currentDate = date.toISOString().split('T')[0];
        this.selectedDateInput.value = this.currentDate;
        this.loadTasks();
        this.updateDateDisplay();
    }

    goToToday() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.selectedDateInput.value = this.currentDate;
        this.loadTasks();
        this.updateDateDisplay();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #48bb78;' : ''}
            ${type === 'error' ? 'background: #f56565;' : ''}
            ${type === 'info' ? 'background: #4299e1;' : ''}
        `;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Styles pour les animations de notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialiser l'application
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new DailyTaskManager();
}); 