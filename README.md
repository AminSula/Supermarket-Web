# Supermarket online ordering platform

Monorepo, single deployable: Spring Boot serves the Angular build.

```
supermarket/
├── backend/     Spring Boot API (Java 17, Maven)
└── frontend/    Angular 18 app (standalone components, signals, ngx-translate)
```

## How the automated build works

`backend/pom.xml` uses `frontend-maven-plugin` to drive the whole build from
one command:

```
cd backend
mvn clean package
```

This does, in order (all wired into Maven's `generate-resources` /
`process-resources` phases, before the jar is packaged):

1. Installs a local Node/npm (no global Node install required on the machine)
2. Runs `npm install` inside `frontend/`
3. Runs `npm run build` → `ng build --configuration production` →
   outputs to `frontend/dist/frontend/browser`
4. Copies that build output into `backend/src/main/resources/static`
5. Packages everything into a single runnable jar

Run it with:

```
java -jar backend/target/backend.jar
```

One process, one port (8080), API under `/api/**`, everything else served
as the Angular app. `SpaWebConfig` forwards unknown non-API routes back to
`index.html` so Angular's client-side router handles them (e.g. a refresh
on `/products/5` won't 404).

## Local development (before you have a full build)

Run backend and frontend separately, same as before, for faster iteration:

```
# terminal 1
cd backend
mvn spring-boot:run

# terminal 2
cd frontend
npm install
npm start   # ng serve on :4200, proxies API calls to :8080 (proxy config to add)
```

## Status

This is the initial scaffold only:
- Backend: Spring Boot app boots, no entities/endpoints yet
- Frontend: app shell with routing, EN/AL language switch, light/dark
  theme toggle, and a placeholder catalog page

Next planned step: JPA entities (User, Category, CategoryTranslation,
Product, ProductImage, Order, OrderItem) + repositories.
