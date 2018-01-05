FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g pm2

EXPOSE 6000

CMD ./run-api.sh
