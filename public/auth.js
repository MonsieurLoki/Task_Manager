// Gestion de l'authentification avec Supabase

// Variables globales
let currentTab = 'login';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est déjà connecté
    checkAuthStatus();
    
    // Ajouter les event listeners
    setupEventListeners();
});

// Vérifier le statut d'authentification
async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
            // L'utilisateur est connecté, rediriger vers l'app principale
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'authentification:', error);
    }
}

// Configuration des event listeners
function setupEventListeners() {
    // Formulaire de connexion
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Formulaire d'inscription
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Écouter les changements d'authentification
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            window.location.href = 'index.html';
        }
    });
}

// Changer d'onglet (connexion/inscription)
function switchTab(tab) {
    currentTab = tab;
    
    // Mettre à jour les onglets
    document.querySelectorAll('.auth-tab').forEach(tabEl => {
        tabEl.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Mettre à jour les formulaires
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('signupForm').classList.add('active');
    }
    
    // Effacer les messages d'erreur
    clearMessages();
}

// Gérer la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    // Validation
    if (!email || !password) {
        showError('login', 'Veuillez remplir tous les champs');
        return;
    }
    
    // Afficher le loading
    setLoading(loginBtn, true);
    clearMessages();
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        // La connexion a réussi, l'utilisateur sera redirigé automatiquement
        // grâce à l'event listener onAuthStateChange
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        
        let errorMessage = 'Une erreur est survenue lors de la connexion';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
        }
        
        showError('login', errorMessage);
    } finally {
        setLoading(loginBtn, false);
    }
}

// Gérer l'inscription
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const signupBtn = document.getElementById('signupBtn');
    
    // Validation
    if (!email || !password || !confirmPassword) {
        showError('signup', 'Veuillez remplir tous les champs');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('signup', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        showError('signup', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    // Afficher le loading
    setLoading(signupBtn, true);
    clearMessages();
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/index.html',
                // Forcer l'envoi de l'email de confirmation
                data: {
                    disable_email_confirm: false
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        // Afficher le message de succès
        showSuccess('signup', 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
        
        // Vider le formulaire
        document.getElementById('signupForm').reset();
        
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        
        let errorMessage = 'Une erreur est survenue lors de l\'inscription';
        
        if (error.message.includes('User already registered')) {
            errorMessage = 'Un compte avec cet email existe déjà';
        } else if (error.message.includes('Password should be at least')) {
            errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
        }
        
        showError('signup', errorMessage);
    } finally {
        setLoading(signupBtn, false);
    }
}

// Afficher un message d'erreur
function showError(formType, message) {
    const errorElement = document.getElementById(formType + 'Error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Afficher un message de succès
function showSuccess(formType, message) {
    const successElement = document.getElementById(formType + 'Success');
    successElement.textContent = message;
    successElement.style.display = 'block';
}

// Effacer tous les messages
function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.style.display = 'none';
    });
}

// Gérer l'état de loading des boutons
function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const loading = button.querySelector('.loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        loading.style.display = 'inline-block';
        button.disabled = true;
    } else {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
        button.disabled = false;
    }
} 