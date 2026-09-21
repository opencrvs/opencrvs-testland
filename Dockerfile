FROM node:22.22.3-alpine
WORKDIR /usr/src/app

# Override the base log level (info).
ENV NPM_CONFIG_LOGLEVEL=warn

# # Install npm dependencies first (so they may be cached if dependencies don't change)
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY yarn.lock yarn.lock
COPY src src
COPY public public
RUN yarn install --production

EXPOSE 3040

ADD start-prod.sh /usr/src/app
RUN chmod +x ./start-prod.sh
CMD ["./start-prod.sh"]
