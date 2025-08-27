# Use an official Node.js 18 image
FROM node:18

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Optional: Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV CORS_ORIGIN=http://localhost:5173      

# Expose the app port
EXPOSE 8080

# Start the app
CMD ["node", "index.js"]
