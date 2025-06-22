-- Fonctions SQL personnalisées pour Supabase

-- Fonction pour calculer les statistiques de réussite des tâches
CREATE OR REPLACE FUNCTION get_task_statistics(user_uuid UUID)
RETURNS TABLE (
    name TEXT,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH WeeklySuccess AS (
        SELECT
            t.id as task_id,
            EXTRACT(YEAR FROM dv.date) || '-' || EXTRACT(WEEK FROM dv.date) as week,
            CAST(SUM(CASE WHEN dv.status = 2 THEN 1 ELSE 0 END) AS NUMERIC) as successes
        FROM recurring_tasks t
        JOIN daily_validations dv ON t.id = dv.task_id
        WHERE t.user_id = user_uuid 
        AND t.target_frequency IS NOT NULL 
        AND t.target_frequency > 0
        GROUP BY t.id, week
    ),
    WeeklySuccessRate AS (
        SELECT
            ws.task_id,
            LEAST(100.0, (ws.successes / t.target_frequency) * 100.0) as weekly_rate
        FROM WeeklySuccess ws
        JOIN recurring_tasks t ON ws.task_id = t.id
    ),
    AverageRates AS (
        SELECT
            task_id,
            AVG(weekly_rate) as avg_success_rate
        FROM WeeklySuccessRate
        GROUP BY task_id
    )
    SELECT
        t.name,
        COALESCE(ar.avg_success_rate, 0) as success_rate
    FROM recurring_tasks t
    LEFT JOIN AverageRates ar ON t.id = ar.task_id
    WHERE t.user_id = user_uuid 
    AND t.target_frequency IS NOT NULL 
    AND t.target_frequency > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les validations d'une semaine
CREATE OR REPLACE FUNCTION get_week_validations(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    task_id UUID,
    task_name TEXT,
    date DATE,
    status INTEGER,
    note TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.task_id,
        rt.name as task_name,
        dv.date,
        dv.status,
        dv.note
    FROM daily_validations dv
    JOIN recurring_tasks rt ON dv.task_id = rt.id
    WHERE dv.user_id = user_uuid
    AND dv.date BETWEEN start_date AND end_date
    ORDER BY rt.name, dv.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le résumé d'une semaine
CREATE OR REPLACE FUNCTION get_week_summary(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    task_id UUID,
    task_name TEXT,
    target_frequency INTEGER,
    completed_count INTEGER,
    partial_count INTEGER,
    not_done_count INTEGER,
    total_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id as task_id,
        rt.name as task_name,
        rt.target_frequency,
        COALESCE(SUM(CASE WHEN dv.status = 2 THEN 1 ELSE 0 END), 0) as completed_count,
        COALESCE(SUM(CASE WHEN dv.status = 1 THEN 1 ELSE 0 END), 0) as partial_count,
        COALESCE(SUM(CASE WHEN dv.status = 0 THEN 1 ELSE 0 END), 0) as not_done_count,
        COUNT(dv.id) as total_days
    FROM recurring_tasks rt
    LEFT JOIN daily_validations dv ON rt.id = dv.task_id 
        AND dv.date BETWEEN start_date AND end_date
    WHERE rt.user_id = user_uuid
    GROUP BY rt.id, rt.name, rt.target_frequency
    ORDER BY rt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 