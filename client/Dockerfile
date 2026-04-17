FROM node:20-alpine

WORKDIR /app

# Enable Next.js telemetry if you want, but ignoring is usually preferred for docker
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Let compose override the command for dev
CMD ["npm", "run", "dev"]
