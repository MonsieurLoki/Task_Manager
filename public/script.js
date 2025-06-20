class DailyTaskManager {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.tasks = [];
        this.editingTaskId = null;
        this.validatingTaskId = null;
        this.selectedStatus = null;
        this.currentView = 'daily'; // 'daily' ou 'history'
        
        this.initializeElements();
        this.bindEvents();
        this.loadTasks();
        this.updateWeekDisplay();
        this.initializeHistoryDates();
    }

    initializeElements() {
        // Éléments de navigation par semaine
        this.prevWeekBtn = document.getElementById('prevWeek');
        this.nextWeekBtn = document.getElementById('nextWeek');
        this.thisWeekBtn = document.getElementById('thisWeekBtn');
        this.weekDisplay = document.getElementById('weekDisplay');

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

        // Modal de validation
        this.validationModal = document.getElementById('validationModal');
        this.validationForm = document.getElementById('validationForm');
        this.validationNote = document.getElementById('validationNote');
        this.closeValidationModalBtn = document.getElementById('closeValidationModal');
        this.cancelValidation = document.getElementById('cancelValidation');
        this.statusButtons = document.querySelectorAll('.status-btn');
    }

    bindEvents() {
        // Navigation par semaine
        this.prevWeekBtn.addEventListener('click', () => this.changeWeek(-1));
        this.nextWeekBtn.addEventListener('click', () => this.changeWeek(1));
        this.thisWeekBtn.addEventListener('click', () => this.goToThisWeek());

        // Changement de vue
        this.dailyViewBtn.addEventListener('click', () => this.switchView('daily'));
        this.historyViewBtn.addEventListener('click', () => this.switchView('history'));

        // Formulaire d'ajout
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Vue historique
        this.loadHistoryBtn.addEventListener('click', () => this.loadHistory());
        this.historyStartDate.addEventListener('input', () => this.updateHistoryDateLimits('start'));
        this.historyEndDate.addEventListener('input', () => this.updateHistoryDateLimits('end'));

        // Modal d'édition
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.editForm.addEventListener('submit', (e) => this.handleEditTask(e));

        // Modal de validation
        this.closeValidationModalBtn.addEventListener('click', () => this.closeValidationModal());
        this.cancelValidation.addEventListener('click', () => this.closeValidationModal());
        this.validationForm.addEventListener('submit', (e) => this.handleValidation(e));

        // Boutons de statut
        this.statusButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectStatus(btn));
        });

        // Fermer modals en cliquant à l'extérieur
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
        });

        this.validationModal.addEventListener('click', (e) => {
            if (e.target === this.validationModal) {
                this.closeValidationModal();
            }
        });

        // Fermer modals avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.editModal.classList.contains('show')) {
                    this.closeModal();
                }
                if (this.validationModal.classList.contains('show')) {
                    this.closeValidationModal();
                }
            }
        });
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = 1, Dimanche = 0
        return new Date(d.setDate(diff));
    }

    getWeekEnd(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd;
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
        lastWeek.setDate(today.getDate() - 6);
        
        this.historyStartDate.value = lastWeek.toISOString().split('T')[0];
        this.historyEndDate.value = today.toISOString().split('T')[0];
        this.updateHistoryDateLimits('start');
    }

    updateHistoryDateLimits(changedInput) {
        const startDateInput = this.historyStartDate;
        const endDateInput = this.historyEndDate;

        if (changedInput === 'start') {
            const startDate = new Date(startDateInput.value);
            const maxEndDate = new Date(startDate);
            maxEndDate.setDate(startDate.getDate() + 11);

            endDateInput.min = startDateInput.value;
            endDateInput.max = maxEndDate.toISOString().split('T')[0];
            
            if (new Date(endDateInput.value) > maxEndDate) {
                endDateInput.value = endDateInput.max;
            }
        } else { // 'end'
            const endDate = new Date(endDateInput.value);
            const minStartDate = new Date(endDate);
            minStartDate.setDate(endDate.getDate() - 11);
            
            startDateInput.max = endDateInput.value;
            startDateInput.min = minStartDate.toISOString().split('T')[0];

            if (new Date(startDateInput.value) < minStartDate) {
                startDateInput.value = startDateInput.min;
            }
        }
    }

    async loadTasks() {
        try {
            // Charger les tâches pour toute la semaine
            const weekEnd = this.getWeekEnd(this.currentWeekStart);
            const response = await fetch(`/api/tasks/history?start_date=${this.currentWeekStart.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`);
            
            if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
            
            const weekData = await response.json();
            this.processWeekData(weekData);
            this.renderTasks();
            this.updateStats();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement des tâches', 'error');
        }
    }

    processWeekData(weekData) {
        // Grouper les données par tâche
        const tasksMap = new Map();
        
        weekData.forEach(item => {
            if (!tasksMap.has(item.id)) {
                tasksMap.set(item.id, {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    created_at: item.created_at,
                    validations: {}
                });
            }
            
            if (item.date) {
                tasksMap.get(item.id).validations[item.date] = {
                    status: item.status,
                    note: item.note
                };
            }
        });

        this.tasks = Array.from(tasksMap.values());
    }

    async loadHistory() {
        const startDate = this.historyStartDate.value;
        const endDate = this.historyEndDate.value;
        
        if (!startDate || !endDate) {
            this.showNotification('Veuillez sélectionner une période', 'error');
            return;
        }

        // Vérifier que la période ne dépasse pas 12 jours
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        if (daysDiff < 0) return; // Ignore if dates are invalid

        if (daysDiff > 12) {
            this.showNotification('La période ne peut pas dépasser 12 jours.', 'error');
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
                    status: item.status,
                    note: item.note
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
                        <th>Valid. %</th>
                    </tr>
                </thead>
                <tbody>
        `;

        tasksMap.forEach(task => {
            const completedCount = task.validations.filter(v => v.status === 2).length;
            const totalDays = dates.length;
            const percentage = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

            tableHTML += `<tr>
                <td class="task-name">${this.escapeHtml(task.title)}</td>
                ${dates.map(date => {
                    const validation = task.validations.find(v => v.date === date);
                    if (!validation) {
                        return '<td class="status-cell"><span class="status-indicator empty">-</span></td>';
                    }
                    const statusClass = this.getStatusClass(validation.status);
                    const statusText = this.getStatusText(validation.status);
                    let cellContent = `<span class="status-indicator ${statusClass}">${statusText}</span>`;
                    
                    if (validation.note) {
                        cellContent += `
                            <div class="note-tooltip">📝
                                <span class="tooltip-text">${this.escapeHtml(validation.note)}</span>
                            </div>
                        `;
                    }
                    
                    return `<td class="status-cell">${cellContent}</td>`;
                }).join('')}
                <td class="percentage-cell">${percentage}%</td>
            </tr>`;
        });

        tableHTML += '</tbody></table>';
        this.historyTable.innerHTML = tableHTML;
    }

    getStatusClass(status) {
        switch (status) {
            case 2: return 'completed';
            case 1: return 'partial';
            case 0: return 'not-done';
            default: return 'empty';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 2: return '✓';
            case 1: return '~';
            case 0: return '✗';
            default: return '-';
        }
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

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Une erreur est survenue.');
            }
            
            const newTask = await response.json();
            this.tasks.push({
                ...newTask,
                validations: {}
            });
            this.renderTasks();
            this.updateStats();
            
            // Réinitialiser le formulaire
            this.taskForm.reset();
            this.showNotification('Tâche récurrente ajoutée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification(error.message, 'error');
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

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Une erreur est survenue.');
            }
            
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
            this.showNotification(error.message, 'error');
        }
    }

    openValidationModal(taskId, date) {
        this.validatingTaskId = taskId;
        this.validatingDate = date;
        this.selectedStatus = null;
        
        // Réinitialiser les boutons
        this.statusButtons.forEach(btn => btn.classList.remove('active'));
        
        // Pré-remplir avec le statut actuel s'il existe
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.validations[date]) {
            const currentStatus = task.validations[date].status;
            this.selectedStatus = currentStatus;
            this.statusButtons.forEach(btn => {
                if (parseInt(btn.dataset.status) === currentStatus) {
                    btn.classList.add('active');
                }
            });
            this.validationNote.value = task.validations[date].note || '';
        } else {
            this.validationNote.value = '';
        }
        
        this.validationModal.classList.add('show');
    }

    selectStatus(button) {
        this.statusButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.selectedStatus = parseInt(button.dataset.status);
    }

    async handleValidation(e) {
        e.preventDefault();
        
        if (this.selectedStatus === null) {
            this.showNotification('Veuillez sélectionner un statut', 'error');
            return;
        }

        const note = this.validationNote.value.trim();

        try {
            const response = await fetch(`/api/tasks/${this.validatingTaskId}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: this.validatingDate,
                    status: this.selectedStatus,
                    note: note || null
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Une erreur est survenue.');
            }
            
            // Mettre à jour localement
            const task = this.tasks.find(t => t.id === this.validatingTaskId);
            if (task) {
                if (!task.validations[this.validatingDate]) {
                    task.validations[this.validatingDate] = {};
                }
                task.validations[this.validatingDate].status = this.selectedStatus;
                task.validations[this.validatingDate].note = note || null;
                this.renderTasks();
                this.updateStats();
            }
            
            this.closeValidationModal();
            this.showNotification('Tâche validée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche récurrente ? Toutes les validations seront également supprimées.')) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Une erreur est survenue.');
            }
            
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();
            this.updateStats();
            this.showNotification('Tâche supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification(error.message, 'error');
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

    closeValidationModal() {
        this.validationModal.classList.remove('show');
        this.validatingTaskId = null;
        this.validatingDate = null;
        this.selectedStatus = null;
        this.validationForm.reset();
    }

    renderTasks() {
        if (this.tasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.noTasksDiv.style.display = 'block';
            return;
        }

        this.tasksList.style.display = 'block';
        this.noTasksDiv.style.display = 'none';

        // Générer les dates de la semaine
        const weekDates = [];
        const current = new Date(this.currentWeekStart);
        for (let i = 0; i < 7; i++) {
            weekDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        this.tasksList.innerHTML = this.tasks.map(task => {
            const taskValidations = weekDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const validation = task.validations[dateStr];
                const status = validation ? validation.status : null;
                const note = validation ? validation.note : null;
                
                return {
                    date: dateStr,
                    status: status,
                    note: note,
                    displayDate: date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })
                };
            });

            return `
                <div class="task-item" data-id="${task.id}">
                    <div class="task-header">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                    </div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    
                    <div class="week-validations">
                        ${taskValidations.map(validation => {
                            const statusClass = validation.status !== null ? this.getStatusClass(validation.status) : 'empty';
                            const statusText = validation.status !== null ? this.getStatusText(validation.status) : '-';
                            const hasNote = validation.note && validation.note.trim() !== '';
                            
                            return `
                                <div class="day-validation">
                                    <div class="day-label">${validation.displayDate}</div>
                                    <div class="task-checkbox ${statusClass}" 
                                         onclick="taskManager.openValidationModal(${task.id}, '${validation.date}')"
                                         title="${hasNote ? 'Note: ' + this.escapeHtml(validation.note) : 'Cliquer pour valider'}">
                                        ${statusText}
                                    </div>
                                    ${hasNote ? `<div class="note-indicator" title="${this.escapeHtml(validation.note)}">📝</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="task-actions">
                        <button class="action-btn edit" onclick="taskManager.openEditModal(${task.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="taskManager.deleteTask(${task.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        let completed = 0;
        let total = 0;

        this.tasks.forEach(task => {
            Object.values(task.validations).forEach(validation => {
                total++;
                if (validation.status === 2) { // Completed
                    completed++;
                }
            });
        });
        
        this.completedCountSpan.textContent = completed;
        this.totalCountSpan.textContent = total;
    }

    updateWeekDisplay() {
        const weekEnd = this.getWeekEnd(this.currentWeekStart);
        const startStr = this.currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const endStr = weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        this.weekDisplay.textContent = `Semaine du ${startStr} au ${endStr}`;
    }

    changeWeek(weeks) {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (weeks * 7));
        this.loadTasks();
        this.updateWeekDisplay();
    }

    goToThisWeek() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.loadTasks();
        this.updateWeekDisplay();
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
    
    .week-validations {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        flex-wrap: wrap;
    }
    
    .day-validation {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    
    .day-label {
        font-size: 0.8rem;
        color: #718096;
        font-weight: 500;
    }
    
    .note-indicator {
        font-size: 0.8rem;
        color: #e53e3e;
        cursor: help;
    }
    
    .note-tooltip {
        font-size: 0.8rem;
        color: #e53e3e;
        cursor: help;
        margin-left: 5px;
    }
`;
document.head.appendChild(style);

// Initialiser l'application
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new DailyTaskManager();
}); 