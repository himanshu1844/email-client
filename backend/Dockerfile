FROM node:18-alpine

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN apk add --no-cache openssl

WORKDIR /app


COPY package*.json ./

RUN npm install --production

COPY . .

RUN npx prisma generate

RUN npx prisma migrate deploy

EXPOSE 8000

CMD ["node", "index.js"]
