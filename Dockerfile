FROM node:22-alpine

WORKDIR /parser

RUN apl add --no-cache python3 make g++
RUN npm install -g node-gyp

COPY /home/joe/Codebase/tree-sitter-automn ./
RUN npm run install
