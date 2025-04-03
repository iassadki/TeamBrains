FROM python:3.9-alpine

# Installez les dépendances nécessaires, y compris postgresql-client
RUN apk update && apk add --no-cache postgresql-client dos2unix

WORKDIR /app

COPY src/servers/teambrains-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install Flask
RUN pip install flask-cors
RUN pip install Flask-SQLAlchemy
RUN pip install psycopg2-binary
RUN pip install PyJWT
RUN pip install python-dotenv
RUN pip install Flask-Bcrypt
RUN pip install flask-jwt-extended
RUN pip install python-dateutil
RUN pip install python-slugify
RUN pip install flask-mail
RUN pip install Flask-Migrate

COPY /infrastructure/images/teambrains-backend/.env .
COPY src/servers/teambrains-backend/ .

RUN ls -l /app

# Créer le dossier migrations
RUN mkdir -p migrations

RUN dos2unix /app/postgres.sh
RUN chmod +x /app/postgres.sh

EXPOSE 5001

CMD ["/app/postgres.sh", "teambrains-database", "python3", "app.py"]

