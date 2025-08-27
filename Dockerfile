# Use official Node.js 20 image (ytdl-core wants >=20.x)
FROM node:20

# Install ffmpeg for mp3 conversion
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "index.js"]
