-- Ce script prépare votre base de données Supabase.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.

-- Étape 1: Créer les tables nécessaires

-- Table pour les tâches récurrentes que l'utilisateur souhaite suivre.
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_frequency INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- S'assurer qu'un utilisateur ne peut pas avoir deux tâches avec le même nom.
    UNIQUE(user_id, name)
);
COMMENT ON TABLE public.recurring_tasks IS 'Tâches récurrentes définies par les utilisateurs.';

-- Table pour enregistrer les validations quotidiennes de chaque tâche.
CREATE TABLE IF NOT EXISTS public.daily_validations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.recurring_tasks(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status INTEGER NOT NULL, -- 0: non fait, 1: partiellement, 2: fait
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- S'assurer qu'il n'y a qu'une seule validation par tâche et par jour pour un utilisateur.
    UNIQUE(user_id, task_id, date)
);
COMMENT ON TABLE public.daily_validations IS 'Enregistrements quotidiens du statut des tâches récurrentes.';

-- Table pour les tâches "à faire" ponctuelles de la journée.
CREATE TABLE IF NOT EXISTS public.today_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.today_tasks IS 'Tâches uniques pour la journée en cours.';


-- Étape 2: Activer la sécurité au niveau des lignes (Row Level Security - RLS)
-- C'est la fonctionnalité clé de Supabase qui garantit que les utilisateurs ne peuvent pas voir ou modifier les données des autres.

ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.today_tasks ENABLE ROW LEVEL SECURITY;


-- Étape 3: Définir les politiques de sécurité
-- Ces politiques définissent les règles d'accès. Ici, on s'assure que chaque utilisateur ne peut interagir qu'avec ses propres données.

-- Politique pour recurring_tasks: Les utilisateurs peuvent gérer (voir, créer, modifier, supprimer) leurs propres tâches.
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres tâches récurrentes"
ON public.recurring_tasks FOR ALL
USING (auth.uid() = user_id);

-- Politique pour daily_validations: Les utilisateurs peuvent gérer leurs propres validations.
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres validations quotidiennes"
ON public.daily_validations FOR ALL
USING (auth.uid() = user_id);

-- Politique pour today_tasks: Les utilisateurs peuvent gérer leurs propres tâches du jour.
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres tâches du jour"
ON public.today_tasks FOR ALL
USING (auth.uid() = user_id); 