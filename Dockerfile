FROM node:22-alpine

# RUN yarn set version berry
# Copying repo resources
COPY ./packages ./packages
COPY ./apps ./apps
COPY ./package.json ./package.json
COPY ./tsconfig.json ./tsconfig.json

EXPOSE 3000
EXPOSE 4000

CMD /usr/bin/tail -f /dev/null
