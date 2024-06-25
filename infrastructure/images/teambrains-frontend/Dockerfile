FROM node:17-alpine
WORKDIR /app
COPY src/servers/teambrains-frontend/package*.json ./
RUN npm i
RUN npm install rippleui
RUN npm install axios
RUN npm update esbuild
RUN npm install react-datepicker
RUN npm install date-fns
RUN npm install react-toastify
RUN npm install jwt-decode

COPY src/servers/teambrains-frontend/ .
EXPOSE 5173
CMD ["npm", "run", "dev"]