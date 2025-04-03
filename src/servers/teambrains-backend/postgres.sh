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

# Initialiser les migrations si le dossier est vide
if [ -z "$(ls -A migrations)" ]; then
    export FLASK_APP=app.py
    flask db init
fi

# Créer et appliquer les migrations
export FLASK_APP=app.py
flask db migrate -m "add progress field to project"
flask db upgrade

# Exécuter la commande principale (python3 app.py)
exec $cmd