FROM node AS base
 
FROM base AS deps
WORKDIR /remix
COPY package*.json ./
RUN npm ci
 
FROM base AS builder
WORKDIR /remix
COPY --from=deps /remix/node_modules ./node_modules
COPY . .
RUN npm run build
 
FROM base AS runner
WORKDIR /remix
COPY --from=builder /remix .

CMD ["npm", "run", "start"]