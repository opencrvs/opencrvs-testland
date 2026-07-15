FROM node:22.22.3-alpine AS deps
WORKDIR /usr/src/app
ENV NPM_CONFIG_LOGLEVEL=warn

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NPM_CONFIG_LOGLEVEL=warn

# Copy dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application files
COPY package.json yarn.lock tsconfig.json ./
COPY src ./src

EXPOSE 3040

CMD ["yarn", "start:prod"]
