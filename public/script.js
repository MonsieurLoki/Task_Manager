class TaskManager {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.tasksMap = new Map(); // "Mémoire" centrale pour les tâches et validations
        this.editingTaskId = null;
        this.validatingTaskId = null;
        this.selectedStatus = null;
        this.currentView = 'daily';
        
        this.initializeElements();
        this.bindEvents();
        this.loadTasks(); // Charge les tâches de la semaine initiale
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
        this.taskNameInput = document.getElementById('taskName');
        this.targetFrequencyInput = document.getElementById('targetFrequency');
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
        this.editForm = document.getElementById('editTaskForm');
        this.editNameInput = document.getElementById('editTaskName');
        this.editTargetFrequencyInput = document.getElementById('editTargetFrequency');
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
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    getWeekEnd(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd;
    }

    switchView(view) {
        this.currentView = view;
        
        this.dailyViewBtn.classList.toggle('active', view === 'daily');
        this.historyViewBtn.classList.toggle('active', view === 'history');
        
        this.dailyView.style.display = view === 'daily' ? 'grid' : 'none';
        this.historyView.style.display = view === 'history' ? 'grid' : 'none';
        
        if (view === 'history') {
            // Synchronise par défaut la vue historique avec la semaine de la vue quotidienne
            const startDate = this.currentWeekStart.toISOString().split('T')[0];
            const endDate = this.getWeekEnd(this.currentWeekStart).toISOString().split('T')[0];
            
            // Met à jour les champs du calendrier, ce qui permet à l'utilisateur de les modifier
            this.historyStartDate.value = startDate;
            this.historyEndDate.value = endDate;
            
            // Charge immédiatement l'historique pour cette période
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
            maxEndDate.setDate(startDate.getDate() + 12);

            endDateInput.min = startDateInput.value;
            endDateInput.max = maxEndDate.toISOString().split('T')[0];
            
            if (new Date(endDateInput.value) > maxEndDate) {
                endDateInput.value = endDateInput.max;
            }
        } else {
            const endDate = new Date(endDateInput.value);
            const minStartDate = new Date(endDate);
            minStartDate.setDate(endDate.getDate() - 12);
            
            startDateInput.max = endDateInput.value;
            startDateInput.min = minStartDate.toISOString().split('T')[0];

            if (new Date(startDateInput.value) < minStartDate) {
                startDateInput.value = startDateInput.min;
            }
        }
    }

    async loadTasks() {
        try {
            const weekEnd = this.getWeekEnd(this.currentWeekStart);
            const response = await fetch(`/api/tasks/history?start_date=${this.currentWeekStart.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`);
            
            if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
            
            const weekData = await response.json();
            this.mergeTaskData(weekData); // Fusionne les nouvelles données
            this.renderTasks();
            this.updateStats();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement des tâches', 'error');
        }
    }

    // NOUVELLE FONCTION pour fusionner les données sans écraser l'historique
    mergeTaskData(taskData) {
        taskData.forEach(item => {
            const task = this.tasksMap.get(item.id) || {
                id: item.id,
                validations: {}
            };

            task.name = item.name;
            task.target_frequency = item.target_frequency;
            task.description = item.description;
            task.created_at = item.created_at;

            if (item.date) {
                task.validations[item.date] = {
                    status: item.status,
                    note: item.note
                };
            }
            
            this.tasksMap.set(item.id, task);
        });
    }

    async loadHistory() {
        const startDate = this.historyStartDate.value;
        const endDate = this.historyEndDate.value;
        
        if (!startDate || !endDate) return;

        try {
            const response = await fetch(`/api/tasks/history?start_date=${startDate}&end_date=${endDate}`);
            if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
            
            const historyData = await response.json();
            this.mergeTaskData(historyData); // Fusionne aussi pour la vue historique
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

        const tasksToRender = new Map();
        historyData.forEach(item => {
            if (!tasksToRender.has(item.id)) {
                tasksToRender.set(item.id, {
                    id: item.id,
                    name: item.name,
                    target_frequency: item.target_frequency,
                    validations: []
                });
            }
            if (item.date) {
                const globalTask = this.tasksMap.get(item.id);
                if (globalTask) {
                    tasksToRender.get(item.id).validations = Object.entries(globalTask.validations).map(([date, val]) => ({ date, ...val }));
                }
            }
        });
        
        const todayStr = new Date().toISOString().split('T')[0];
        const dates = this.generateDateRange(startDate, endDate);
        
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Tâche</th>
                        ${dates.map(date => {
                            const isCurrentDay = date === todayStr;
                            return `<th class="${isCurrentDay ? 'current-day-header' : ''}">${this.formatDateForTable(date)}</th>`;
                        }).join('')}
                        <th>Objectif %</th>
                    </tr>
                </thead>
                <tbody>
        `;

        tasksToRender.forEach(task => {
            const validationsInPeriod = task.validations.filter(v => v.date >= startDate && v.date <= endDate);
            const completedCount = validationsInPeriod.filter(v => v.status === 2).length;
            let percentageText = '-';
            let progressText = ''; // Pour afficher (3/5)

            if (task.target_frequency) {
                let percentage = task.target_frequency > 0 ? (completedCount / task.target_frequency) * 100 : 0;
                percentage = Math.min(percentage, 100);
                percentageText = `${Math.round(percentage)}%`;
                progressText = `<span class="history-progress">(${completedCount}/${task.target_frequency})</span>`;
            }

            tableHTML += `<tr>
                <td class="task-name">${this.escapeHtml(task.name)} ${progressText}</td>
                ${dates.map(date => {
                    const validation = task.validations.find(v => v.date === date);
                    const isCurrentDay = date === todayStr;
                    let cellContent;

                    if (!validation) {
                        cellContent = '<span class="status-indicator empty">-</span>';
                    } else {
                        const statusClass = this.getStatusClass(validation.status);
                        const statusText = this.getStatusText(validation.status);
                        cellContent = `<span class="status-indicator ${statusClass}">${statusText}</span>`;
                        if (validation.note) {
                            cellContent += `<div class="note-tooltip">📝<span class="tooltip-text">${this.escapeHtml(validation.note)}</span></div>`;
                        }
                    }
                    return `<td class="status-cell ${isCurrentDay ? 'current-day-cell' : ''}">${cellContent}</td>`;
                }).join('')}
                <td class="percentage-cell">${percentageText}</td>
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
        
        const name = this.taskNameInput.value.trim();
        const target_frequency = parseInt(this.targetFrequencyInput.value) || null;
        const description = this.taskDescriptionInput.value.trim();
        
        if (!name) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, target_frequency, description })
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Erreur');
            
            const newTask = await response.json();
            // Ajout à la "mémoire" centrale
            this.tasksMap.set(newTask.id, { ...newTask, validations: {} });
            
            this.renderTasks();
            this.updateStats();
            this.taskForm.reset();
            this.showNotification('Tâche ajoutée avec succès', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleEditTask(e) {
        e.preventDefault();
        
        const name = this.editNameInput.value.trim();
        const target_frequency = parseInt(this.editTargetFrequencyInput.value) || null;
        const description = this.editDescriptionInput.value.trim();
        
        if (!name || !this.editingTaskId) return;

        try {
            const response = await fetch(`/api/tasks/${this.editingTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, target_frequency, description })
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Erreur');
            
            const updatedTask = await response.json();
            // Mise à jour dans la "mémoire" centrale
            const task = this.tasksMap.get(this.editingTaskId);
            if (task) {
                task.name = updatedTask.name;
                task.target_frequency = updatedTask.target_frequency;
                task.description = updatedTask.description;
                this.tasksMap.set(this.editingTaskId, task);
            }
            
            this.renderTasks();
            this.closeModal();
            this.showNotification('Tâche modifiée avec succès', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    openValidationModal(taskId, date) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (date > todayStr) {
            this.showNotification('Vous ne pouvez pas valider un jour futur.', 'error');
            return;
        }
        
        this.validatingTaskId = taskId;
        this.validatingDate = date;
        this.selectedStatus = null;
        
        this.statusButtons.forEach(btn => btn.classList.remove('active'));
        
        const task = this.tasksMap.get(taskId);
        const validationExists = task && task.validations[date];
        
        if (validationExists) {
            this.initialStatus = task.validations[date].status; // On garde en mémoire l'état initial
            this.selectedStatus = this.initialStatus;
            this.statusButtons.forEach(btn => {
                if (parseInt(btn.dataset.status) === this.initialStatus) btn.classList.add('active');
            });
            this.validationNote.value = task.validations[date].note || '';
        } else {
            this.initialStatus = null;
            this.validationNote.value = '';
        }
        
        this.validationModal.classList.add('show');
    }

    selectStatus(button) {
        const status = parseInt(button.dataset.status);

        // Si le bouton cliqué est déjà actif, on désélectionne tout
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            this.selectedStatus = null;
        } else {
            // Sinon, on met à jour normalement
            this.statusButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            this.selectedStatus = status;
        }
    }

    async handleValidation(e) {
        e.preventDefault();
        
        // Si aucun statut n'est sélectionné MAIS qu'il y en avait un avant
        if (this.selectedStatus === null && this.initialStatus !== null) {
            // C'est une demande de suppression
            await this.handleDeleteValidation();
            return;
        }

        // Si aucun statut n'est sélectionné et qu'il n'y en avait pas avant, on ne fait rien
        if (this.selectedStatus === null) {
            this.closeValidationModal();
            return;
        }

        const note = this.validationNote.value.trim();

        try {
            const response = await fetch(`/api/tasks/${this.validatingTaskId}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: this.validatingDate, status: this.selectedStatus, note: note || null })
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Erreur');
            
            const task = this.tasksMap.get(this.validatingTaskId);
            if (task) {
                task.validations[this.validatingDate] = { status: this.selectedStatus, note: note || null };
                this.tasksMap.set(this.validatingTaskId, task);
                this.renderTasks();
                this.updateStats();
            }
            
            this.closeValidationModal();
            this.showNotification('Tâche validée avec succès', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleDeleteValidation() {
        if (!this.validatingTaskId || !this.validatingDate) return;

        try {
            const response = await fetch(`/api/tasks/${this.validatingTaskId}/validate`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: this.validatingDate })
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Erreur de suppression');

            const task = this.tasksMap.get(this.validatingTaskId);
            if (task) {
                delete task.validations[this.validatingDate];
                this.tasksMap.set(this.validatingTaskId, task);
                this.renderTasks();
                this.updateStats();
            }

            this.closeValidationModal();
            this.showNotification('Validation supprimée', 'info');

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche récurrente ?')) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || 'Erreur');
            
            // Suppression de la "mémoire" centrale
            this.tasksMap.delete(taskId);
            this.renderTasks();
            this.updateStats();
            this.showNotification('Tâche supprimée avec succès', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    openEditModal(taskId) {
        // Utilise la "mémoire" centrale pour trouver les infos
        const task = this.tasksMap.get(taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        this.editNameInput.value = task.name;
        this.editTargetFrequencyInput.value = task.target_frequency || '';
        this.editDescriptionInput.value = task.description || '';
        this.editModal.classList.add('show');
        this.editNameInput.focus();
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
        const tasks = Array.from(this.tasksMap.values());
        if (tasks.length === 0) {
            this.tasksList.innerHTML = '';
            this.tasksList.style.display = 'none';
            this.noTasksDiv.style.display = 'block';
            return;
        }

        this.tasksList.style.display = 'block';
        this.noTasksDiv.style.display = 'none';

        const weekDates = [];
        const current = new Date(this.currentWeekStart);
        for (let i = 0; i < 7; i++) {
            weekDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const todayStr = new Date().toISOString().split('T')[0];

        this.tasksList.innerHTML = tasks.map(task => {
            const taskValidations = weekDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const validation = task.validations[dateStr];
                const isFutureDate = dateStr > todayStr;
                const isCurrentDay = dateStr === todayStr;
                
                return {
                    date: dateStr,
                    status: validation ? validation.status : null,
                    note: validation ? validation.note : null,
                    displayDate: date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }),
                    isFutureDate: isFutureDate,
                    isCurrentDay: isCurrentDay
                };
            });

            const progress = this.calculateProgress(task);
            const streakInfo = this.calculateStreak(task);

            return `
                <div class="task-item" data-id="${task.id}">
                    <div class="task-header">
                        <div class="task-name">${this.escapeHtml(task.name)}</div>
                        <div class="task-meta">
                            ${task.target_frequency ? `<span class="task-target" title="Objectif hebdomadaire">🎯 ${progress.completedCount}/${task.target_frequency}</span>` : ''}
                            ${streakInfo.streak > 0 && task.target_frequency === 7 ? `<span class="task-streak" title="Série de validations consécutives">🔥 ${streakInfo.streak}</span>` : ''}
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="week-validations">
                        ${taskValidations.map(v => {
                            const statusClass = v.status !== null ? this.getStatusClass(v.status) : 'empty';
                            const isClickable = !v.isFutureDate;
                            return `
                                <div class="day-validation ${v.isCurrentDay ? 'current-day' : ''}">
                                    <div class="day-label">${v.displayDate}</div>
                                    <div class="task-checkbox ${statusClass} ${!isClickable ? 'future-date' : ''}" 
                                         ${isClickable ? `onclick="taskManager.openValidationModal(${task.id}, '${v.date}')"` : ''}
                                         title="${v.isFutureDate ? 'Jour futur' : v.note ? this.escapeHtml(v.note) : 'Valider'}">
                                        ${this.getStatusText(v.status)}
                                    </div>
                                    ${v.note ? `<div class="note-indicator" title="${this.escapeHtml(v.note)}">📝</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit" onclick="taskManager.openEditModal(${task.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="taskManager.deleteTask(${task.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        let completedInWeek = 0;
        let totalInWeek = 0;
        
        const weekDates = this.generateDateRange(
            this.currentWeekStart.toISOString().split('T')[0],
            this.getWeekEnd(this.currentWeekStart).toISOString().split('T')[0]
        );

        this.tasksMap.forEach(task => {
            weekDates.forEach(date => {
                if (task.validations[date]) {
                    totalInWeek++;
                    if (task.validations[date].status === 2) {
                        completedInWeek++;
                    }
                }
            });
        });
        
        this.completedCountSpan.textContent = completedInWeek;
        this.totalCountSpan.textContent = totalInWeek;
    }

    updateWeekDisplay() {
        const weekEnd = this.getWeekEnd(this.currentWeekStart);
        const startStr = this.currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const endStr = weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        this.weekDisplay.textContent = `Semaine du ${startStr} au ${endStr}`;
    }

    changeWeek(weeks) {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (weeks * 7));
        this.loadTasks(); // Recharge les données pour la nouvelle semaine (qui seront fusionnées)
        this.updateWeekDisplay();
    }

    goToThisWeek() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.loadTasks();
        this.updateWeekDisplay();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
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

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    calculateProgress(task) {
        const weekDates = this.generateDateRange(
            this.currentWeekStart.toISOString().split('T')[0],
            this.getWeekEnd(this.currentWeekStart).toISOString().split('T')[0]
        );
        let completedCount = 0;

        weekDates.forEach(date => {
            if (task.validations[date] && task.validations[date].status === 2) {
                completedCount++;
            }
        });
        return { completedCount };
    }

    calculateStreak(task) {
        let streak = 0;
        let checkDate = new Date();
        
        // Boucle pour vérifier les jours passés
        for (let i = 0; i < 365; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const validation = task.validations[dateStr];

            if (validation && validation.status === 2) {
                streak++;
            } else {
                // La série se brise si un jour n'est pas validé (sauf aujourd'hui)
                const todayStr = new Date().toISOString().split('T')[0];
                if (dateStr !== todayStr) {
                    break;
                }
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return { streak };
    }
}

// Styles pour les animations et éléments de gamification
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
    
    .task-meta {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 5px;
    }
    
    .task-target {
        background: #4299e1;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .task-streak {
        background: #ed8936;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .task-checkbox.future-date {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #f7fafc;
        border: 1px solid #e2e8f0;
    }
    
    .task-checkbox.future-date:hover {
        background-color: #f7fafc;
        transform: none;
    }

    /* --- NOUVEAUX STYLES --- */

    /* Vue Quotidienne - Surlignage du jour actuel */
    .day-validation.current-day .day-label {
        font-weight: 700;
        color: #4299e1; /* Bleu pour attirer l'oeil */
    }

    /* Vue Historique - Surlignage de la colonne du jour actuel */
    .history-table .current-day-header {
        background-color: #ebf8ff;
        color: #2c5282;
    }

    .history-table .current-day-cell {
        background-color: #ebf8ff;
    }

    /* Vue Historique - Texte de progression à côté du nom de la tâche */
    .history-progress {
        font-size: 0.8rem;
        font-weight: 500;
        color: #718096; /* Gris discret */
        margin-left: 8px;
    }
`;
document.head.appendChild(style);

// Initialiser l'application
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
}); 