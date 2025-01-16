FROM node AS base
ENV NODE_ENV production
ENV ENVIRONMENT production
ENV PORT 3000
 
# Stage 1: Install all node_modules, including dev dependencies
FROM base as deps
WORKDIR /portfolio
ADD package.json ./
RUN npm install --include=dev

# Stage 2: Setup production node_modules
FROM base as production-deps
WORKDIR /portfolio
COPY --from=deps /portfolio/node_modules /portfolio/node_modules
ADD package.json ./
RUN npm prune --omit=dev

# Stage 3: Build the app
FROM base as build
WORKDIR /portfolio
COPY --from=deps /portfolio/node_modules /portfolio/node_modules
ADD . .
RUN npm run build

# Stage 4: Build the production image
FROM base
WORKDIR /portfolio
COPY --from=production-deps /portfolio/node_modules /portfolio/node_modules
COPY --from=build /portfolio/build /portfolio/build
COPY --from=build /portfolio/public /portfolio/public
ADD . .

CMD ["npm", "run", "start"]