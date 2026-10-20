# Architecture Diagrams

## Application Data Flow

```mermaid
flowchart TD
    User[User]
    Web[Next.js web application]
    Auth[Keycloak / BC Government Common Logon]
    API[NestJS API]
    DB[(Aurora PostgreSQL)]

    User -->|HTTPS| Web
    Web -->|OAuth2/OIDC login and token refresh| Auth
    Auth -->|Access and refresh tokens| Web
    Web -->|Authenticated REST requests| API

    API --> Users[Users and organizations]
    API --> Settings[Care-setting templates and permissions]
    API --> Planning[Planning sessions]
    API --> Suggestions[Suggestion engine]
    API --> KPI[KPI and feedback services]

    Users --> DB
    Settings --> DB
    Planning --> DB
    Suggestions -->|Read session activities and permissions| DB
    KPI --> DB
    API -->|Responses and exports| Web
```

The application data flow shows logical application interactions. The API
validates tokens and resolves user roles before coordinating care-setting
management, planning sessions, suggestions, KPI queries, and feedback
persistence through the database.

The network topology is documented separately in
[Network Diagram](./network-diagram.md).
