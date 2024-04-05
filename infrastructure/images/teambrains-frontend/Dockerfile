FROM node:17-alpine
WORKDIR /app
COPY src/servers/teambrains-frontend/package.json .
RUN npm i
RUN npm install rippleui
RUN npm install axios
RUN npm update esbuild

COPY src/servers/teambrains-frontend/ .
EXPOSE 5173
CMD ["npm", "run", "dev"]