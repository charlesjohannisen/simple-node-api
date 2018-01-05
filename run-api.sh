#!/bin/bash

# docker build -f ./Dockerfile -t generic-node-api .
# docker build -f ./Dockerfile.mongo -t generic-node-api-mongo .
# docker network create --ip-range 172.22.0.0/16 --subnet 172.22.0.0/16 --gateway=172.22.0.1 generic-network
# docker run -v $(PWD)/mongo-public:/public:rw --ip 172.22.0.2 --network generic-network -p 27019:27017 -d --name generic-node-api-mongo generic-node-api-mongo
# docker run -v $(PWD):/usr/src/app:rw --ip 172.22.0.3 --network generic-network -p 6000:6000 -d --name generic-node-api generic-node-api

npm install
pm2 start pm2.json

while true; do
    sleep 60
done
