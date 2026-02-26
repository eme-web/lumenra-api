FROM node:20-bullseye

WORKDIR /app

RUN apt-get update --fix-missing

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN npx prisma generate

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD service nginx start && npm start

