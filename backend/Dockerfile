# Base image
FROM node:16

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy project files
COPY . .

# Expose the port and run the app
EXPOSE 80
CMD ["npm", "start"]