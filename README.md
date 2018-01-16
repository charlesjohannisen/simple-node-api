# Generic Node API

Essential, simple code to get you started with your server-side node API:
- Database ops with Mongoose
- User authentication ( register, sign-in, email-verification, password-reset )
- Email with Sendgrid
- File upload with AWS
- Image crop and resize

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisities

What things you need to install the software and how to install them

```
- NodeJS >= 8
- MongoDB
```

### Installing

```
npm install -g pm2
npm install
copy env.example to .env and alter the variables as required.
copy pm2.json.example to pm2.json
```

### Run

```
pm2 start pm2.json
```
