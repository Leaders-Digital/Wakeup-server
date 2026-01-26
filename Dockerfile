FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Create uploads directory in the image (will be overridden by volume mount in production)
RUN mkdir -p uploads
ENV Mongo_URI=mongodb+srv://leadersdev1:eeYrZtYTykpEvZoB@cluster0.xpa7e.mongodb.net/test?retryWrites=true&w=majority
ENV EMAIL_USER=noreply@leaders-makeup.com
ENV EMAIL_PASS=SiteWeb@MakeUp@2024
ENV JWT_SECRET=leader@leader@degital2023@@?
ENV API_KEY=AIzaSyD-1X6JQJ3Q
# Expose port
EXPOSE 7000

# Command to run the app
CMD ["npm", "start"]
