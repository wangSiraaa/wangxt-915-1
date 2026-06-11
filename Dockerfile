FROM node:20-slim

WORKDIR /app

RUN mkdir -p /app/data

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "api/server.ts"]
