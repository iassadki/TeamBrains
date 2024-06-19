# TeamBrains: La Plateforme de Collaboration entre Entrepreneurs et Étudiants en Informatique

## Site Web
(soon)

## Concept & Problématiques
### L’Entrepreneur
- **Défis**: Obstacles techniques et financiers, difficulté à trouver un associé approprié.
- **Solution**: Collaboration avec des étudiants en informatique désireux d'acquérir de l'expérience et de relever des défis, sans rémunération.
- **Objectif**: Créer un prototype, une version test ou une maquette pour faciliter la présentation à des partenaires et investisseurs potentiels.

### L’Étudiant
- **Ambition**: Acquérir de l'expérience cruciale pour la réussite professionnelle.
- **Opportunité**: Contribuer à des projets informatiques de grande envergure et acquérir de l'expérience.
- **Flexibilité**: Participation sans contraintes de statut salarié, freelance ou projet d'étude.

## Projets
La plateforme est dédiée exclusivement aux projets informatiques et digitaux, y compris les sites web, applications mobiles, logiciels, design, gestion de données, intelligence artificielle, machine learning, cybersécurité, systèmes d'information, et robotique.

## Fonctionnement
1. **Inscription**: En tant qu’entrepreneur ou étudiant/junior.
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

# Déploiement du projet
Cette partie a pour but de guider étape par étape l’utilisateur sur le processus de build et déploiement du projet TeamBrains.

Avant de commencer l'installation de notre plateforme, assurez-vous que disposez de Docker Desktop installé sur votre machine.

Voici les étapes à suivre pour déployer notre plateforme sur votre système :

## Étape 1 : Ouvrir le terminal
Ouvrez votre terminal. Sur Windows, vous pouvez utiliser PowerShell ou l'invite de commandes. Sur MacOS et Linux, vous pouvez utiliser le terminal intégré.

## Étape 2 : Se placer dans le répertoire cible
Naviguez jusqu'au répertoire dans lequel vous souhaitez cloner le projet. Utilisez la commande cd (change directory) pour cela. Par exemple, si vous souhaitez placer le projet dans un répertoire nommé "MonProjet" sur le bureau, vous écririez :
```cd ~/Desktop/MonProjet```

## Étape 3: Cloner le projet
Vous pouvez maintenant cloner le projet à partir du dépôt GitHub. Utilisez la commande git clone pour cela :
```git clone https://github.com/benribou/TeamBrains.git```

Ceci clonera le projet dans le répertoire "MonProjet".

## Étape 4: Lancer l'application avec Docker

Naviguez jusqu'au répertoire **"/infrastructure"**. Maintenant, vous pouvez lancer la plateforme avec Docker. Utilisez la commande docker pour construire et démarrer les services de votre application : ```docker-compose up --build```

Le build peut durer quelques minutes en fonction de votre connexion internet.

Veuillez noter que chaque étape suppose que vous êtes dans le répertoire du projet après avoir cloné le dépôt. Si vous rencontrez des erreurs, assurez-vous que vous êtes dans le bon répertoire avant d'exécuter chaque commande.

Une fois le build terminé, vous devriez voir vos 3 conteneurs tourner sur Docker Dekstop.
Si c’est le cas, félicitation le projet doit maintenant être en cours d'exécution sur votre système et vous devriez pouvoir y accéder via l’url suivante sur le navigateur de votre ordinateur : 

```localhost```

Et le projet est lancé !
