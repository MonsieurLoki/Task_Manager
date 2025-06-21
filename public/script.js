class TaskManager {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.tasksMap = new Map(); // "Mémoire" centrale pour les tâches et validations
        this.editingTaskId = null;
        this.validatingTaskId = null;
        this.selectedStatus = null;
        this.currentView = 'daily';
        
        this.initializeTheme();
        this.initializeElements();
        this.bindEvents();
        
        // Appliquer l'état de la vue initiale
        this.switchView(this.currentView);
        
        this.initializeTasks();
        this.updateWeekDisplay();
        this.initializeHistoryDates();
    }

    // Gestion du thème
    initializeTheme() {
        this.themeToggle = document.getElementById('themeToggle');
        
        // Récupère le thème sauvegardé ou utilise la préférence système
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (prefersDark) {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
        
        // Écoute les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Met à jour l'état du toggle
        if (this.themeToggle) {
            this.themeToggle.setAttribute('aria-pressed', theme === 'dark');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Animation du toggle
        this.themeToggle.classList.add('toggling');
        setTimeout(() => {
            this.themeToggle.classList.remove('toggling');
        }, 300);
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
        this.deleteValidationBtn = document.getElementById('deleteValidationBtn');
        this.statusButtons = document.querySelectorAll('.status-btn');
        this.focusModeToggle = document.getElementById('focusMode');

        // Vue Calendrier
        this.heatmapViewBtn = document.getElementById('heatmapViewBtn');
        this.heatmapView = document.getElementById('heatmapView');
        this.heatmapYearSelect = document.getElementById('heatmapYear');
        this.heatmapGrid = document.getElementById('heatmapGrid');
        this.noHeatmapData = document.getElementById('noHeatmapData');

        // Vue Statistiques
        this.statsViewBtn = document.getElementById('statsViewBtn');
        this.statsView = document.getElementById('statsView');
        this.noStatsData = document.getElementById('noStatsData');
        this.taskSuccessChart = null;

        // Tâches ponctuelles d'aujourd'hui
        this.todayTaskForm = document.getElementById('todayTaskForm');
        this.todayTaskNameInput = document.getElementById('todayTaskName');
        this.todayTasksList = document.getElementById('todayTasksList');
        this.noTodayTasksDiv = document.getElementById('noTodayTasks');

        // Sélecteur de vue
        this.weekViewBtn = document.getElementById('weekViewBtn');
        this.todayViewBtn = document.getElementById('todayViewBtn');
        this.weekView = document.getElementById('weekView');
        this.todayView = document.getElementById('todayView');
    }

    bindEvents() {
        // Toggle de thème
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Navigation par semaine
        this.prevWeekBtn.addEventListener('click', () => this.changeWeek(-1));
        this.nextWeekBtn.addEventListener('click', () => this.changeWeek(1));
        this.thisWeekBtn.addEventListener('click', () => this.goToThisWeek());

        // Changement de vue
        this.dailyViewBtn.addEventListener('click', () => this.switchView('daily'));
        this.historyViewBtn.addEventListener('click', () => this.switchView('history'));
        this.heatmapViewBtn.addEventListener('click', () => this.switchView('heatmap'));
        this.statsViewBtn.addEventListener('click', () => this.switchView('stats'));
        this.focusModeToggle.addEventListener('change', () => this.renderTasks());
        this.heatmapYearSelect.addEventListener('change', () => this.loadHeatmapData());

        // Formulaire d'ajout
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Formulaire des tâches ponctuelles d'aujourd'hui
        this.todayTaskForm.addEventListener('submit', (e) => this.handleAddTodayTask(e));

        // Sélecteur de vue
        this.weekViewBtn.addEventListener('click', () => this.switchContentView('week'));
        this.todayViewBtn.addEventListener('click', () => this.switchContentView('today'));

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
        this.deleteValidationBtn.addEventListener('click', () => this.handleDeleteValidation());
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
        
        // Ajoute une classe au body pour styler le sélecteur de vue en conséquence
        document.body.classList.toggle('daily-view-active', view === 'daily');

        this.dailyViewBtn.classList.toggle('active', view === 'daily');
        this.historyViewBtn.classList.toggle('active', view === 'history');
        this.heatmapViewBtn.classList.toggle('active', view === 'heatmap');
        this.statsViewBtn.classList.toggle('active', view === 'stats');
        
        this.dailyView.style.display = view === 'daily' ? 'grid' : 'none';
        this.historyView.style.display = view === 'history' ? 'grid' : 'none';
        this.heatmapView.style.display = view === 'heatmap' ? 'block' : 'none';
        this.statsView.style.display = view === 'stats' ? 'flex' : 'none';
        
        if (view === 'history') {
            // Récupère la semaine actuellement affichée dans la vue quotidienne
            const weekStart = this.currentWeekStart;
            const weekEnd = this.getWeekEnd(weekStart);
            
            // Applique ces dates aux champs de la vue historique
            this.historyStartDate.value = weekStart.toISOString().split('T')[0];
            this.historyEndDate.value = weekEnd.toISOString().split('T')[0];
            
            // Met à jour les contraintes du calendrier (important)
            this.updateHistoryDateLimits('start');

            // Charge l'historique pour cette nouvelle période
            this.loadHistory();
            this.loadAndRenderStatistics();
        } else if (view === 'heatmap') {
            this.initializeHeatmap();
        } else if (view === 'stats') {
            this.loadAndRenderStatistics();
        }
    }

    // Basculement entre les vues du contenu (semaine/aujourd'hui)
    switchContentView(view) {
        // Mise à jour des boutons
        this.weekViewBtn.classList.toggle('active', view === 'week');
        this.todayViewBtn.classList.toggle('active', view === 'today');
        
        // Mise à jour des panneaux
        this.weekView.classList.toggle('active', view === 'week');
        this.todayView.classList.toggle('active', view === 'today');
        
        // Animation de transition
        if (view === 'today') {
            // Recharger les tâches d'aujourd'hui si nécessaire
            this.loadTodayTasks();
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

    async initializeTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
            
            const tasks = await response.json();
            tasks.forEach(task => {
                this.tasksMap.set(task.id, { ...task, validations: {} });
            });
            
            await this.loadValidationsForCurrentWeek();
            this.renderTasks();
            this.updateStats();
            
            // Charger les tâches d'aujourd'hui
            this.loadTodayTasks();
        } catch (error) {
            console.error('Erreur initialisation:', error);
            this.showNotification('Erreur lors du chargement des tâches', 'error');
        }
    }

    async loadValidationsForCurrentWeek() {
        try {
            const weekEnd = this.getWeekEnd(this.currentWeekStart);
            const response = await fetch(`/api/validations/range?start_date=${this.currentWeekStart.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`);
            
            if (!response.ok) throw new Error('Erreur lors du chargement des validations');
            
            const validations = await response.json();
            this.mergeValidationData(validations);
        } catch (error) {
            console.error('Erreur chargement validations:', error);
            this.showNotification('Erreur lors du chargement des données de la semaine', 'error');
        }
    }

    mergeValidationData(validations) {
        // D'abord, on réinitialise les validations pour la semaine en cours pour éviter les doublons
        for (const task of this.tasksMap.values()) {
            // Logique un peu plus complexe pour ne pas effacer tout l'historique chargé
            // mais seulement la semaine en cours. Pour l'instant on garde simple.
        }

        validations.forEach(validation => {
            const task = this.tasksMap.get(validation.task_id);
            if (task) {
                task.validations[validation.date] = {
                    status: validation.status,
                    note: validation.note
                };
            }
        });
    }

    async loadHistory() {
        const startDate = this.historyStartDate.value;
        const endDate = this.historyEndDate.value;
        if (!startDate || !endDate) {
            this.showNotification('Veuillez sélectionner une période valide.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/validations/range?start_date=${startDate}&end_date=${endDate}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement de l\'historique');
            }
            const validations = await response.json();
            this.mergeValidationData(validations);
            this.renderHistory(startDate, endDate);

        } catch (error) {
            console.error(error);
            this.showNotification('Erreur lors du chargement de l\'historique', 'error');
            this.historyTable.innerHTML = '';
            this.noHistoryDiv.style.display = 'block';
        }
    }

    renderHistory(startDateStr, endDateStr) {
        const tasks = Array.from(this.tasksMap.values());
        if (tasks.length === 0) {
            this.historyTable.innerHTML = '';
            this.noHistoryDiv.style.display = 'block';
            return;
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const dateRange = this.generateDateRange(startDate, endDate);
        const todayStr = new Date().toISOString().split('T')[0];

        let tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Tâche</th>
                        ${dateRange.map(date => `<th class="date-cell ${date === todayStr ? 'current-day-header' : ''}">${this.formatDateForTable(date)}</th>`).join('')}
                        <th>% Réussite</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const task of tasks) {
            let completedCount = 0;
            const totalDaysInPeriod = dateRange.length;

            const cells = dateRange.map(date => {
                const validation = task.validations[date];
                if (validation && validation.status === 2) {
                    completedCount++;
                }
                const statusClass = this.getStatusClass(validation ? validation.status : -1);
                const statusText = this.getStatusText(validation ? validation.status : -1);
                const noteHtml = validation && validation.note
                    ? `<span class="note-tooltip"><i class="fas fa-comment-alt"></i><span class="tooltip-text">${this.escapeHtml(validation.note)}</span></span>`
                    : '';
                const isCurrentDay = date === todayStr;
                return `<td class="status-cell ${isCurrentDay ? 'current-day-cell' : ''}"><span class="status-indicator ${statusClass}">${statusText}</span>${noteHtml}</td>`;
            }).join('');

            const target = task.target_frequency;
            let percentage = 0;
            let proratedTarget = 0;
            
            if (target > 0 && totalDaysInPeriod > 0) {
                proratedTarget = (target / 7) * totalDaysInPeriod;
                percentage = proratedTarget > 0 ? (completedCount / proratedTarget) * 100 : 0;
                percentage = Math.min(percentage, 100);
            } else if (totalDaysInPeriod > 0) {
                percentage = (completedCount / totalDaysInPeriod) * 100;
            }
            
            const progressText = target ? `(Objectif: ${completedCount}/${Math.round(proratedTarget)})` : `(${completedCount}/${totalDaysInPeriod})`;

            tableHtml += `
                <tr>
                    <td class="task-name">
                        ${this.escapeHtml(task.name)}
                        <span class="history-progress">${progressText}</span>
                    </td>
                    ${cells}
                    <td class="percentage-cell">${percentage.toFixed(0)}%</td>
                </tr>
            `;
        }

        tableHtml += `</tbody></table>`;
        this.historyTable.innerHTML = tableHtml;
        this.noHistoryDiv.style.display = 'none';
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

    // Gestion des tâches ponctuelles d'aujourd'hui
    async handleAddTodayTask(e) {
        e.preventDefault();
        
        const name = this.todayTaskNameInput.value.trim();
        if (!name) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch('/api/today-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, date: today })
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Erreur');
            
            this.todayTaskNameInput.value = '';
            this.loadTodayTasks();
            this.showNotification('Tâche du jour ajoutée', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async loadTodayTasks() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/today-tasks?date=${today}`);
            
            if (!response.ok) throw new Error('Erreur lors du chargement');
            
            const todayTasks = await response.json();
            this.renderTodayTasks(todayTasks);
        } catch (error) {
            console.error('Erreur chargement tâches du jour:', error);
            this.renderTodayTasks([]);
        }
    }

    renderTodayTasks(tasks) {
        if (tasks.length === 0) {
            this.todayTasksList.innerHTML = '';
            this.noTodayTasksDiv.style.display = 'block';
            return;
        }

        this.noTodayTasksDiv.style.display = 'none';
        this.todayTasksList.innerHTML = tasks.map(task => `
            <div class="today-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="today-task-checkbox ${task.completed ? 'completed' : ''}" onclick="taskManager.toggleTodayTask(${task.id})"></div>
                <div class="today-task-text">${this.escapeHtml(task.name)}</div>
                <button class="today-task-delete" onclick="taskManager.deleteTodayTask(${task.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    async toggleTodayTask(taskId) {
        try {
            const response = await fetch(`/api/today-tasks/${taskId}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Erreur lors de la modification');
            
            this.loadTodayTasks();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async deleteTodayTask(taskId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

        try {
            const response = await fetch(`/api/today-tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');
            
            this.loadTodayTasks();
            this.showNotification('Tâche supprimée', 'success');
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
        const task = this.tasksMap.get(taskId);
        if (!task) return;

        this.validatingTaskId = taskId;
        this.validatingDate = date;
        this.selectedStatus = null;
        this.statusButtons.forEach(btn => btn.classList.remove('active'));
        
        const validation = task.validations[date];
        if (validation) {
            this.validationNote.value = validation.note || '';
            const statusBtn = this.validationForm.querySelector(`.status-btn[data-status="${validation.status}"]`);
            if(statusBtn) {
                statusBtn.classList.add('active');
                this.selectedStatus = validation.status;
            }
            this.deleteValidationBtn.style.display = 'inline-flex';
        } else {
            this.validationNote.value = '';
            this.deleteValidationBtn.style.display = 'none';
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
        if (this.selectedStatus === null) {
            this.showNotification('Veuillez sélectionner un statut.', 'error');
            return;
        }

        const note = this.validationNote.value.trim();
        const taskId = this.validatingTaskId;
        const date = this.validatingDate;

        try {
            const response = await fetch('/api/validations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    date: date,
                    status: this.selectedStatus,
                    note: note
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erreur inattendue du serveur' }));
                throw new Error(errorData.error);
            }

            // Mettre à jour l'état local dans tasksMap
            const task = this.tasksMap.get(taskId);
            if (task) {
                task.validations[date] = { status: this.selectedStatus, note };
            }

            this.closeValidationModal();
            this.renderTasks(); // Rafraîchir l'affichage
            this.updateStats();
            this.showNotification('Validation enregistrée avec succès.', 'success');

        } catch (error) {
            console.error('Erreur validation:', error);
            this.showNotification(error.message || 'Impossible d\'enregistrer la validation.', 'error');
        }
    }

    async handleDeleteValidation() {
        const taskId = this.validatingTaskId;
        const date = this.validatingDate;

        try {
            const response = await fetch('/api/validations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: taskId, date: date })
            });

            if (!response.ok && response.status !== 204) {
                 const errorData = await response.json().catch(() => ({ error: 'Erreur inattendue du serveur' }));
                throw new Error(errorData.error);
            }

            const task = this.tasksMap.get(taskId);
            if (task && task.validations[date]) {
                delete task.validations[date];
            }

            this.closeValidationModal();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Validation retirée avec succès.', 'success');

        } catch (error) {
            console.error('Erreur suppression validation:', error);
            this.showNotification(error.message || 'Impossible de retirer la validation.', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche et tout son historique ?')) return;

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
        let tasks = Array.from(this.tasksMap.values());

        // --- Logique du Mode Focus ---
        const isFocusMode = this.focusModeToggle.checked;
        if (isFocusMode) {
            tasks = tasks.filter(task => {
                if (!task.target_frequency) {
                    return true; // Garde les tâches sans objectif
                }
                const progress = this.calculateProgress(task);
                return progress.completedCount < task.target_frequency;
            });
        }

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
        this.updateWeekDisplay();
        this.loadValidationsForCurrentWeek().then(() => {
            this.renderTasks();
            this.updateStats();
        });
    }

    goToThisWeek() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.updateWeekDisplay();
        this.loadValidationsForCurrentWeek().then(() => {
            this.renderTasks();
            this.updateStats();
        });
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

    // --- NOUVELLES FONCTIONS POUR LA HEATMAP ---

    initializeHeatmap() {
        const currentYear = new Date().getFullYear();
        if (this.heatmapYearSelect.options.length === 0) {
            for (let year = currentYear + 1; year >= 2020; year--) {
                const option = new Option(year, year);
                this.heatmapYearSelect.add(option);
            }
        }
        this.heatmapYearSelect.value = currentYear;
        this.loadHeatmapData();
    }

    async loadHeatmapData() {
        const year = this.heatmapYearSelect.value;
        try {
            const response = await fetch(`/api/heatmap?year=${year}`);
            if (!response.ok) throw new Error('Erreur de chargement des données de la heatmap');
            const data = await response.json();
            this.renderHeatmap(data, parseInt(year));
        } catch (error) {
            console.error('Erreur Heatmap:', error);
            this.heatmapGrid.innerHTML = '';
            this.noHeatmapData.style.display = 'block';
        }
    }

    renderHeatmap(data, year) {
        this.heatmapGrid.innerHTML = '';
        this.noHeatmapData.style.display = 'none';

        if (!data || data.length === 0) {
            this.noHeatmapData.style.display = 'block';
            return;
        }

        const dataMap = new Map(data.map(item => [item.date, item.completion_count]));

        const wrapper = document.createElement('div');
        wrapper.className = 'heatmap-wrapper';

        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'heatmap-months';
        wrapper.appendChild(monthsContainer);
        
        const weekdaysAndCells = document.createElement('div');
        weekdaysAndCells.className = 'heatmap-graph';
        wrapper.appendChild(weekdaysAndCells);

        const weekdaysContainer = document.createElement('div');
        weekdaysContainer.className = 'heatmap-weekdays';
        weekdaysAndCells.appendChild(weekdaysContainer);

        const cellsContainer = document.createElement('div');
        cellsContainer.className = 'heatmap-cells';
        weekdaysAndCells.appendChild(cellsContainer);

        // --- Populate weekdays ---
        weekdaysContainer.innerHTML = `
            <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
        `;

        // --- Populate cells ---
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const dayCount = Math.round((endDate - startDate) / (1000 * 3600 * 24)) + 1;

        let firstDayIndex = startDate.getDay(); // 0 = Sun
        if (firstDayIndex === 0) {
          firstDayIndex = 6; // We want Mon to be 0, so Sun is 6
        } else {
          firstDayIndex--;
        }

        for (let i = 0; i < firstDayIndex; i++) {
            const spacer = document.createElement('div');
            spacer.classList.add('heatmap-cell');
            cellsContainer.appendChild(spacer);
        }

        for (let i = 0; i < dayCount; i++) {
            const current = new Date(startDate);
            current.setDate(current.getDate() + i);
            const dateStr = current.toISOString().split('T')[0];
            const count = dataMap.get(dateStr) || 0;
            
            let level = 0;
            if (count > 0) level = 1;
            if (count >= 2) level = 2;
            if (count >= 4) level = 3;
            if (count >= 6) level = 4;

            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${level}`;
            cell.title = `${count} tâche(s) complétée(s) le ${current.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            cellsContainer.appendChild(cell);
        }
        
        // --- Populate months ---
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        let currentMonth = -1;
        
        // Ajustement pour le calcul de la semaine des mois
        for (let week = 0; week < 53; week++) {
            const firstDayOfWeek = new Date(year, 0, 1 + week * 7 - firstDayIndex);
            if(firstDayOfWeek > new Date(year, 11, 31)) break;

            if (firstDayOfWeek.getFullYear() === year && firstDayOfWeek.getMonth() !== currentMonth) {
                currentMonth = firstDayOfWeek.getMonth();
                const monthLabel = document.createElement('div');
                monthLabel.textContent = monthNames[currentMonth];
                monthLabel.style.gridColumn = week + 1;
                monthsContainer.appendChild(monthLabel);
            }
        }

        this.heatmapGrid.appendChild(wrapper);
    }

    async loadAndRenderStatistics() {
        try {
            const response = await fetch('/api/statistics');
            if (!response.ok) throw new Error('Erreur de chargement des statistiques');
            const stats = await response.json();

            const haveTaskData = stats.taskSuccess && stats.taskSuccess.length > 0;

            if (!haveTaskData) {
                this.noStatsData.style.display = 'block';
                return;
            }
            this.noStatsData.style.display = 'none';

            if (haveTaskData) this.renderTaskSuccessChart(stats.taskSuccess);

        } catch (error) {
            console.error('Erreur stats:', error);
            this.noStatsData.style.display = 'block';
            this.showNotification('Impossible de charger les statistiques', 'error');
        }
    }

    renderTaskSuccessChart(data) {
        if (this.taskSuccessChart) {
            this.taskSuccessChart.destroy();
        }
        const container = document.getElementById('taskSuccessChart').parentElement;
        container.innerHTML = '<canvas id="taskSuccessChart"></canvas>';
        
        // Gérer la largeur dynamique
        const numTasks = data.length;
        if (numTasks > 0) {
            const barWidth = 80;
            const baseWidth = 150;
            let calculatedWidth = baseWidth + numTasks * barWidth;

            const minWidth = 300;
            const maxWidth = 1100;

            calculatedWidth = Math.max(minWidth, calculatedWidth);
            calculatedWidth = Math.min(maxWidth, calculatedWidth);
            
            container.style.width = `${calculatedWidth}px`;
        } else {
            container.style.width = '100%';
        }

        const ctx = document.getElementById('taskSuccessChart').getContext('2d');
        this.taskSuccessChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: '% de réussite',
                    data: data.map(d => d.success_rate.toFixed(2)),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + "%"
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
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

    /* --- NOUVEAUX STYLES POUR LE MODE FOCUS --- */
    .focus-mode-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .focus-label {
        font-weight: 600;
        color: #4a5568;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
    }

    input:checked + .slider {
        background-color: #48bb78; /* Vert succès */
    }

    input:checked + .slider:before {
        transform: translateX(20px);
    }

    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
    }

    /* --- NOUVEAUX STYLES POUR LA HEATMAP --- */

    #heatmapView {
        display: none;
        flex-direction: column;
        gap: 20px;
    }

    .heatmap-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .heatmap-controls {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .heatmap-grid {
        display: flex;
        flex-direction: column;
        gap: 5px;
        overflow-x: auto;
        padding: 5px;
    }

    .heatmap-month {
        display: flex;
        gap: 10px;
    }

    .heatmap-month-title {
        width: 35px;
        font-size: 0.8rem;
        color: #718096;
        text-align: right;
        flex-shrink: 0;
        margin-top: 20px;
    }
    
    .heatmap-days-container {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: repeat(7, 1fr);
        gap: 3px;
    }

    .heatmap-cell {
        width: 16px;
        height: 16px;
        background-color: #ebedf0;
        border-radius: 3px;
        border: 1px solid rgba(27, 31, 35, 0.06);
    }
    
    .heatmap-cell.spacer {
        background-color: transparent;
        border: none;
    }

    .heatmap-cell.level-1 { background-color: #9be9a8; }
    .heatmap-cell.level-2 { background-color: #40c463; }
    .heatmap-cell.level-3 { background-color: #30a14e; }
    .heatmap-cell.level-4 { background-color: #216e39; }

    .heatmap-legend {
        display: flex;
        align-items: center;
        gap: 5px;
        justify-content: flex-end;
        font-size: 0.8rem;
        color: #586069;
        margin-top: 10px;
    }
    .heatmap-legend .legend-cell {
        border: 1px solid rgba(27, 31, 35, 0.1);
    }
    .heatmap-legend .level-0 { background-color: #ebedf0; }
`;
document.head.appendChild(style);

// Initialiser l'application
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
}); 