# Use Node.js 20 official image
FROM node:20

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV CORS_ORIGIN=http://localhost:5173

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "index.js"]
