FROM node:lts-alpine
ENV NODE_ENV=development
WORKDIR /usr/src/app

# Set the PORT environment variable to 85
ENV PORT=85

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Install babel plugin separately
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object@7.21.11

# Copy rest of the application
COPY . .

# Expose the port 85
EXPOSE 85

# Run the app
CMD ["npm", "start"]
