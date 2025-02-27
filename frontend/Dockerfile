FROM node:18-alpine

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN npm install -g npm@latest

RUN npm install

#RUN npm run build

CMD npm run dev -- --port 3000 --host
