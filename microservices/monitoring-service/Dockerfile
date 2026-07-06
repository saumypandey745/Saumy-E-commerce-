FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g pnpm && pnpm install

COPY . .

EXPOSE 8006

CMD ["npm", "start"]
