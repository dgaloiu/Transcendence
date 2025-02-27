FROM node:18-alpine

WORKDIR /usr/src/app

RUN npm install -g \
	npm@latest \
	@nestjs/cli


COPY --chown=node:node . .

RUN npm install

ENTRYPOINT npm run prisma:start && (npm run prisma:studio &) && npm run start:dev

#RUN npm run build

#CMD npm run start:dev -- --host --port 4000 --port 5555
