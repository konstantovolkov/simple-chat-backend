## build stage
FROM node:16.14.2-alpine as build
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY src /app/src

RUN npm ci
RUN npm run build

## run stage
FROM node:16.14.2-alpine 
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 8080

COPY package.json ./
COPY package-lock.json ./
COPY --from=build /app/build .

RUN npm ci --production
CMD ["node", "index.js"]