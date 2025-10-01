# Internationally Educated Nurses hiring portal project. 

[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)]()
The codebase is being roughed out, but finer details are likely to change.

## Project structure

### Tech stack

- Runtime environment - NodeJS
- Programming language - Typescript
- Database - PostgreSQL
- Backend API server - NestJS
    - Express
    - TypeORM
- Frontend React framework - NextJS
    - Formik
    - Tailwind CSS
    - class-validator
    - Cypress
- Deployment
    - GitHub Actions
    - Terraform
    - AWS CloudFront/S3/Lambda/RDS

### Yarn workspaces

| Workspace or Package   | Description                   | README                                     |
|------------------------|-------------------------------|--------------------------------------------|
| apps/api               | Backend **NestJS** API server |                |
| apps/web               | Frontend **NextJS** React app |               |
| packages/common        | Shared library                |         |
| packages/accessibility | **Accessibility** Test        |  |

## Common issues and solutions

### AWS and Local environment differences with Buffer types

On AWS, the app encountered an issue with request body coming in as Buffer instead of JSON. This was resolved by adding an interceptor to parse the body back to JSON if it is found to be a Buffer at [apps/api/src/app.config.ts](apps/api/src/app.config.ts). The interceptor can be found in [apps/api/src/common/interceptors/request-transform.interceptor.ts](apps/api/src/common/interceptors/request-transform.interceptor.ts).

### ```error This project's package.json defines "packageManager": "yarn@3.2.3". However the current global version of Yarn is 1.22.22.```

This can be fixed by installing the correct version of yarn.

```bash
yarn set version latest
```

Or if this does not work, you can disable the ```"packageManager"``` check by removing the line from ```package.json```.

## How to run the apps

### Run as docker containers

The `Make` command `run-local` to build and launch containers is defined in [Makefile](Makefile).

- create containers

  ```bash
  $ make run-local
  ```
- destroy containers

  ```bash
  $ make docker-down
  ```
  
Containers:
- team_based_care_db
- team_based_care_common
- team_based_care_web
- team_based_care_api

Containers are configured by [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml)

### Make apps connect to each other.

> **Database Hostname Resolution**
>
> `POSTGRES_HOST` env is defined as `db`, which is used as a service name in [docker-compose.yml](docker-compose.yml). As `api` uses it to connect to the database and a service name is resolved as an address only in Docker environment, you need to redefine it to resolve it on your local machine. You can set it to `localhost` if you persistently run the app in this way. Otherwise, add `127.0.0.1 db` to `/etc/hosts`.

> **API Calls**
>
> `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`
>
> To make successful requests from `web` to `api`, you need to set `NEXT_PUBLIC_API_URL` environment variable. It is set by default when using Docker or run by `make` command, but if you run the application by `next start` command in `apps/web` folder, you should supply this value by creating a file named `.env.local` placed in `apps/web`.

> In order to make breakpoints work in `watch` mode, set `sourceMap` to `true` in [tsconfig.json](tsconfig.json) and restart the apps.