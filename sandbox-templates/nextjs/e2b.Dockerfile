# You can use most Debian-based base images
# Chosing our environment
FROM node:21-slim

# Run the terminal command to install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy a bash cript file (important)
COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
# Change the respository
WORKDIR /home/user/nextjs-app

# Create the nextjs app, and ansewr all the questions with yes so that the terminal doesn't hang
RUN npx --yes create-next-app@15.3.3 . --yes

RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force
RUN npx --yes shadcn@2.6.3 add --all --yes

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app