FROM node:boron

# Create app directory
WORKDIR /usr/src/app

# Move SSH keys into container
COPY ./docker-ssh /usr/src/app
COPY ./docker-ssh.sh /usr/src/app
ENV GIT_SSH="/usr/src/app/docker-ssh.sh"
ENV EXTRAS=pagenodes-proprietary

# Install app dependencies
COPY package.json .
# COPY package-lock.json .
# For npm@5 or later, copy package-lock.json as well
# COPY package.json package-lock.json .
RUN npm install
RUN cd node_modules
RUN git clone git@github.com:iceddev/pagenodes-proprietary.git
RUN cd ..

# Bundle app source and remove ssh keys from build
COPY . /usr/src/app
RUN rm /usr/src/app/docker-ssh

RUN npm run build

EXPOSE 5000
CMD [ "npm", "run", "serve:build" ]
