#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
shift
cmd="$@"

until PGPASSWORD=teambrains psql -h "$host" -U "teambrains" -d "teambrains" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"

# Exporter les variables d'environnement nécessaires
export FLASK_APP=app.py
export FLASK_ENV=development

# Supprimer la table des migrations si elle existe
echo "Nettoyage de la table des migrations..."
PGPASSWORD=teambrains psql -h "$host" -U "teambrains" -d "teambrains" -c "DROP TABLE IF EXISTS alembic_version;"

# Supprimer le dossier migrations existant s'il existe
echo "Suppression du dossier migrations..."
rm -rf migrations

# Initialiser les migrations
echo "Initialisation des migrations..."
flask db init

# Créer une nouvelle migration
echo "Création de la migration..."
flask db migrate -m "initial migration"

# Appliquer la migration
echo "Application de la migration..."
flask db upgrade

# Vérifier l'état des migrations
echo "Vérification de l'état des migrations..."
flask db current

# Exécuter la commande principale (python3 app.py)
exec $cmd