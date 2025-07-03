# TeamBrains: La Plateforme de Collaboration entre Entrepreneurs et Étudiants en Informatique

## Site Web
(soon)

## Jeu de données de test

Lors du premier lancement, la base de données est automatiquement remplie avec un jeu de données complet. Vous pouvez vous connecter avec les identifiants suivants :

| Rôle              | Email                                 | Mot de passe    |
|-------------------|---------------------------------------|-----------------|
| Étudiant          | alice@polytechnique.fr                | alice123        |
| Étudiant          | bob@polytechnique.fr                  | bob123          |
| Étudiant          | chloe@hec.fr                          | chloe123        |
| Entrepreneur      | paul.lemoine@entrepreneurs.com        | paul123         |
| Admin plateforme  | admin@teambrains.fr                   | admin123        |
| Admin école       | admin.polytechnique@polytechnique.fr  | polytech123     |
| Admin école       | admin.hec@hec.fr                      | hec123          |

Vous pouvez utiliser ces comptes pour tester toutes les fonctionnalités de la plateforme (connexion, gestion de projet, espace école, etc.).

## Concept & Problématiques
### L'Entrepreneur
- **Défis**: Obstacles techniques et financiers, difficulté à trouver un associé approprié.
- **Solution**: Collaboration avec des étudiants en informatique désireux d'acquérir de l'expérience et de relever des défis, sans rémunération.
- **Objectif**: Créer un prototype, une version test ou une maquette pour faciliter la présentation à des partenaires et investisseurs potentiels.

### L'Étudiant
- **Ambition**: Acquérir de l'expérience cruciale pour la réussite professionnelle.
- **Opportunité**: Contribuer à des projets informatiques de grande envergure et acquérir de l'expérience.
- **Flexibilité**: Participation sans contraintes de statut salarié, freelance ou projet d'étude.

## Projets
La plateforme est dédiée exclusivement aux projets informatiques et digitaux, y compris les sites web, applications mobiles, logiciels, design, gestion de données, intelligence artificielle, machine learning, cybersécurité, systèmes d'information, et robotique.

## Fonctionnement
1. **Inscription**: En tant qu'entrepreneur ou étudiant/junior.
2. **Profil**: Remplir les informations de profil, incluant compétences et technologies pour les étudiants (langages, frameworks, bases de données).
3. **Publication des Projets**: Visibles en entier par les étudiants. Entrepreneurs voient une version minimale, sauf pour leurs propres projets.
4. **Inscription aux Projets**: Étudiants peuvent s'inscrire aux projets.
5. **Catégorisation des Projets**: Projets regroupés par catégories pour faciliter la recherche.

## Équipe Projet
- **Formation d'Équipe**: Les entrepreneurs peuvent constituer des équipes de 1 à 3 membres, avec des compétences en front-end, back-end et full-stack.
- **Rôles dans l'Équipe**: Chaque équipe peut inclure front-end, back-end, et/ou full-stack. Une équipe complète doit avoir au moins un membre front-end et un membre back-end ou un membre full-stack.
- **Collaboration**: Une fois l'équipe formée, les entrepreneurs ont accès aux contacts des étudiants pour faciliter la collaboration.

## Note
TeamBrains vise à créer un écosystème où la passion pour l'informatique et l'ambition entrepreneuriale se rencontrent pour transformer les idées en réalités tangibles, en favorisant une expérience enrichissante pour tous les participants. Rejoignez-nous pour bâtir l'avenir !

# Guide de Déploiement TeamBrains

## 1. Lancement de l'application avec Docker

```bash
docker-compose -f infrastructure/compose.yaml up --build
```

- Cette commande lance tous les services (backend, frontend, base de données, etc.)
- **Environnement de développement frontend** :
  1. Arrête le conteneur frontend (par exemple via Docker Desktop ou `docker-compose stop frontend`)
  2. Va dans le dossier du frontend :
     ```bash
     cd src/servers/teambrains-frontend
     npm install
     npm run dev
     ```
  3. Le frontend sera accessible sur [http://localhost:5173](http://localhost:5173) avec hot reload.

## 2. Installation de Stripe CLI (pour le développement)

Stripe CLI permet de simuler des webhooks et de tester l'intégration Stripe localement.

- **Installation (macOS/Linux)** :
  ```bash
  brew install stripe/stripe-cli/stripe
  # ou
  npm install -g stripe
  ```
- **Installation (Windows)** :
  Télécharger depuis : https://stripe.com/docs/stripe-cli#install

## 3. Lancement de Stripe CLI (webhooks)

Pour recevoir les webhooks Stripe dans votre backend local :

```bash
stripe listen --forward-to localhost:5001/webhook/stripe
```

- Cette commande va écouter les événements Stripe et les rediriger vers votre backend Flask.
- Le terminal affichera une clé secrète de webhook à copier dans vos variables d'environnement (`STRIPE_WEBHOOK_SECRET`).

---

**Résumé** :
- Docker pour tout lancer rapidement
- Frontend en mode dev pour le hot reload
- Stripe CLI pour simuler les paiements et webhooks

Pour toute question, consultez la documentation interne ou contactez l'équipe TeamBrains !
