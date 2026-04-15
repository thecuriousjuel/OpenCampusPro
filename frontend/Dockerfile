FROM node:24-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run the frontend dev server, ensuring it binds to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
