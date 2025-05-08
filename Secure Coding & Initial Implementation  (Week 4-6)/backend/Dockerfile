# Use Node.js LTS (Long Term Support) version
FROM node:16-slim

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gnupg \
    curl \
    && curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor \
    && echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y mongodb-mongosh \
    && rm -rf /var/lib/apt/lists/*

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies with clean install for production
RUN npm install --omit=dev && \
    npm audit fix --force

# Bundle app source
COPY . .

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    PORT=5001

# Expose the port the app runs on
EXPOSE 5001

# Create a script to check MongoDB connection
RUN echo '#!/bin/sh\n\
echo "Waiting for MongoDB to be ready..."\n\
until mongosh $MONGODB_URI --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; do\n\
  echo "MongoDB is not ready - retrying..."\n\
  sleep 2\n\
done\n\
echo "MongoDB is ready!"\n\
exec node server.js' > /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"] 