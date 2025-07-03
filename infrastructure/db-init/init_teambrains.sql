-- Jeu de données TeamBrains (exemple complet)

-- Écoles
INSERT INTO schools (id, name, description, contact_email, website, created_at, is_active)
VALUES (1, 'École Polytechnique', 'Grande école d''ingénieurs', 'contact@polytechnique.fr', 'https://polytechnique.fr', NOW(), TRUE),
       (2, 'HEC Paris', 'École de commerce', 'contact@hec.fr', 'https://hec.fr', NOW(), TRUE);

-- Utilisateurs
INSERT INTO users (id, role, nom, prenom, email, password, school_id)
VALUES ('u1', 'student', 'Dupont', 'Alice', 'alice@polytechnique.fr', 'hashedpassword', 1),
       ('u2', 'student', 'Martin', 'Bob', 'bob@polytechnique.fr', 'hashedpassword', 1),
       ('u3', 'student', 'Durand', 'Chloé', 'chloe@hec.fr', 'hashedpassword', 2),
       ('u4', 'admin', 'Admin', 'Super', 'admin@teambrains.fr', 'hashedpassword', NULL),
       ('u5', 'school_admin', 'Admin', 'Polytechnique', 'admin.polytechnique@polytechnique.fr', 'hashedpassword', 1),
       ('u6', 'school_admin', 'Admin', 'HEC', 'admin.hec@hec.fr', 'hashedpassword', 2);

-- Compétences
INSERT INTO skills (id, name, category, description, created_at, is_active)
VALUES (1, 'Python', 'backend', 'Programmation Python', NOW(), TRUE),
       (2, 'React', 'frontend', 'Développement React', NOW(), TRUE),
       (3, 'SQL', 'database', 'Gestion de base de données', NOW(), TRUE);

-- UserSkill
INSERT INTO user_skills (user_id, skill_id, level, acquired_date, last_updated)
VALUES ('u1', 1, 'avancé', NOW(), NOW()),
       ('u2', 2, 'débutant', NOW(), NOW()),
       ('u3', 3, 'intermédiaire', NOW(), NOW());

-- Projets
INSERT INTO projects (id, name, project_slug, creation_date, status, description, creator_id, progress)
VALUES (1, 'Projet IA', 'projet-ia', NOW(), 'en cours', 'Projet d''intelligence artificielle', 'u1', 50),
       (2, 'Plateforme Web', 'plateforme-web', NOW(), 'terminé', 'Développement d''une plateforme web', 'u3', 100);

-- Membres de projet
INSERT INTO project_members (project_id, user_id, role)
VALUES (1, 'u1', 'chef'), (1, 'u2', 'membre'), (2, 'u3', 'chef'), (2, 'u4', 'mentor');

-- Tâches
INSERT INTO tasks (id, title, description, due_date, percent_completion, assignee_id, project_id, priority, sprint)
VALUES (1, 'Collecte de données', 'Rassembler les datasets', NOW() + INTERVAL '7 days', 20, 'u2', 1, 'haute', 'Sprint 1'),
       (2, 'Déploiement', 'Déployer sur le cloud', NOW() + INTERVAL '14 days', 100, 'u3', 2, 'moyenne', 'Sprint 2');

-- Sous-tâches
INSERT INTO subtasks (id, title, description, due_date, percent_completion, priority, status, task_id, assigned_student_id, created_date)
VALUES (1, 'Télécharger dataset', 'Télécharger depuis Kaggle', NOW() + INTERVAL '2 days', 100, 'haute', 'done', 1, 'u2', NOW()),
       (2, 'Nettoyer données', 'Supprimer les valeurs manquantes', NOW() + INTERVAL '4 days', 0, 'moyenne', 'pending', 1, 'u1', NOW());

-- Validations de tâches
INSERT INTO task_validations (id, task_id, status, comment, validator_id, timestamp)
VALUES (1, 1, 'validé', 'OK', 'u1', NOW());

-- Validations de sous-tâches
INSERT INTO subtask_validations (id, subtask_id, status, feedback, validator_id, timestamp)
VALUES (1, 1, 'validé', 'Bien joué', 'u1', NOW());

-- Attribution tâche-étudiant
INSERT INTO task_students (id, task_id, student_id, role, assigned_date)
VALUES (1, 1, 'u2', 'développeur', NOW());

-- Messages
INSERT INTO messages (id, content, project_id, sender_id, timestamp)
VALUES (1, 'Bienvenue sur le projet IA !', 1, 'u1', NOW()),
       (2, 'Déploiement terminé.', 2, 'u3', NOW());

-- Fichiers
INSERT INTO files (id, filename, original_filename, file_path, file_size, file_type, upload_date, uploader_id, project_id)
VALUES (1, 'dataset.csv', 'dataset.csv', '/files/dataset.csv', 2048, 'csv', NOW(), 'u2', 1);

-- Visibilité CV
INSERT INTO cv_visibility (id, user_id, is_public, show_personal_info, show_contact_info, show_skills, show_projects, last_updated)
VALUES (1, 'u1', TRUE, TRUE, TRUE, TRUE, TRUE, NOW());

-- CVProject
INSERT INTO cv_projects (id, user_id, project_id, role, start_date, end_date, team_size, description)
VALUES (1, 'u1', 1, 'Chef de projet', NOW() - INTERVAL '30 days', NOW(), 2, 'Pilotage du projet IA');

-- Tokens écoles
INSERT INTO school_tokens (id, school_id, token, name, created_at, is_active)
VALUES (1, 1, 'TOKEN123', 'Token principal', NOW(), TRUE);

-- Tokens d'inscription
INSERT INTO school_registration_tokens (id, school_id, token, name, max_uses, current_uses, created_at, is_active)
VALUES (1, 1, 'REG2024', 'Promo 2024', 100, 10, NOW(), TRUE);

-- Usage écoles
INSERT INTO school_usage (id, school_id, usage_date, active_students_count, recorded_at)
VALUES (1, 1, NOW()::date, 2, NOW());

-- Factures écoles
INSERT INTO school_invoices (id, school_id, billing_year, billing_month, total_amount_centimes, days_billed, student_days, average_students, invoice_date)
VALUES (1, 1, 2024, 6, 10000, 30, 60, 2, NOW());

-- Abonnements
INSERT INTO subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, plan_type, status, current_period_start, current_period_end, created_at, updated_at)
VALUES (1, 'u1', 'sub_123', 'cus_123', 'student', 'active', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW());

-- Factures
INSERT INTO invoices (id, user_id, subscription_id, stripe_invoice_id, amount_paid, currency, status, invoice_date, created_at)
VALUES (1, 'u1', 1, 'inv_123', 1000, 'eur', 'paid', NOW(), NOW()); 