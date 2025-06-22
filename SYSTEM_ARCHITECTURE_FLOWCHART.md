# System Architecture Flow Chart

## Complete System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[User Interface]
        B[React Components]
        C[WebSocket Client]
        D[API Client]
    end
    
    subgraph "API Gateway"
        E[Express Server]
        F[Route Handlers]
        G[Authentication]
        H[Validation]
    end
    
    subgraph "Business Logic"
        I[VastAI Manager]
        J[ComfyUI Manager]
        K[Image Generator]
        L[Progress Monitor]
    end
    
    subgraph "External Services"
        M[Vast.ai API]
        N[GPU Servers]
        O[ComfyUI Instances]
    end
    
    subgraph "Data Layer"
        P[(PostgreSQL DB)]
        Q[File Storage]
        R[Model Cache]
    end
    
    subgraph "Real-time Communication"
        S[WebSocket Server]
        T[Progress Events]
        U[Status Updates]
    end
    
    A --> B
    B --> C
    B --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
    H --> K
    
    I --> M
    M --> N
    N --> O
    J --> O
    K --> O
    
    F --> P
    O --> Q
    O --> R
    
    L --> S
    S --> T
    T --> U
    U --> C
    
    style A fill:#e1f5fe
    style P fill:#f3e5f5
    style M fill:#fff3e0
    style S fill:#e8f5e8
```

## Detailed Component Interaction Flow

### 1. Server Creation and Setup Process

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as API Server
    participant VA as Vast.ai API
    participant DB as Database
    participant SSH as SSH Manager
    participant CUI as ComfyUI
    
    U->>UI: Select GPU & Create Server
    UI->>API: POST /api/vast-servers
    API->>VA: Create Instance Request
    VA-->>API: Instance Details
    API->>DB: Save Server Record
    API-->>UI: Server Created Response
    
    U->>UI: Start ComfyUI Setup
    UI->>API: POST /api/comfy/startup/:id
    API->>DB: Create Execution Record
    API->>SSH: Connect to Server
    SSH->>CUI: Execute Setup Script
    CUI-->>SSH: Progress Updates
    SSH-->>API: Real-time Logs
    API->>DB: Update Execution Status
    API-->>UI: Setup Complete
```

### 2. Image Generation Workflow

```mermaid
graph TD
    A[User Submits Prompt] --> B{Server Available?}
    B -->|Yes| C[Create Generation Record]
    B -->|No| D[Queue Request]
    
    C --> E[Validate Prompt]
    E --> F[Check Required Models]
    F --> G{Models Available?}
    
    G -->|Yes| H[Queue to ComfyUI]
    G -->|No| I[Download Models]
    I --> H
    
    H --> J[Start Generation]
    J --> K[Monitor Progress]
    K --> L{Generation Complete?}
    
    L -->|No| M[Update Progress]
    M --> K
    L -->|Yes| N[Process Results]
    
    N --> O[Save Images]
    O --> P[Update Database]
    P --> Q[Notify User]
    
    D --> R[Check Queue]
    R --> S{Slot Available?}
    S -->|Yes| C
    S -->|No| T[Wait in Queue]
    T --> R
    
    style A fill:#bbdefb
    style Q fill:#c8e6c9
    style T fill:#ffcdd2
```

### 3. Real-time Progress Monitoring

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Queued: ComfyUI Accepts
    Queued --> Executing: Start Processing
    Executing --> Progress: Update Events
    Progress --> Executing: Continue
    Executing --> Completed: Success
    Executing --> Failed: Error
    Completed --> [*]
    Failed --> [*]
    
    Progress: Real-time Updates
    Progress: WebSocket Events
    Progress: Frontend Notifications
```

## Data Flow Architecture

### 1. Database Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ VAST_SERVERS : owns
    VAST_SERVERS ||--o{ SERVER_EXECUTIONS : has
    VAST_SERVERS ||--o{ COMFY_GENERATIONS : hosts
    SETUP_SCRIPTS ||--o{ SERVER_EXECUTIONS : used_in
    COMFY_WORKFLOWS ||--o{ COMFY_GENERATIONS : defines
    COMFY_MODELS ||--o{ WORKFLOW_MODELS : included_in
    COMFY_WORKFLOWS ||--o{ WORKFLOW_MODELS : contains
    
    USERS {
        int id PK
        string email
        string username
        string password_hash
        timestamp created_at
    }
    
    VAST_SERVERS {
        int id PK
        string vast_id UK
        string name
        string gpu
        int gpu_count
        string status
        decimal price_per_hour
        timestamp created_at
    }
    
    COMFY_GENERATIONS {
        int id PK
        int server_id FK
        int workflow_id FK
        text prompt
        text negative_prompt
        jsonb parameters
        string status
        text[] image_urls
        timestamp created_at
    }
    
    SERVER_EXECUTIONS {
        int id PK
        int server_id FK
        int script_id FK
        string status
        text output
        text error_log
        timestamp started_at
        timestamp completed_at
    }
```

### 2. API Request/Response Flow

```mermaid
graph LR
    subgraph "Client Requests"
        CR1[Create Server]
        CR2[Setup ComfyUI]
        CR3[Generate Image]
        CR4[Monitor Progress]
    end
    
    subgraph "API Processing"
        AP1[Validate Request]
        AP2[Database Operations]
        AP3[External API Calls]
        AP4[Business Logic]
    end
    
    subgraph "Response Types"
        RT1[JSON Response]
        RT2[WebSocket Events]
        RT3[File Downloads]
        RT4[Error Messages]
    end
    
    CR1 --> AP1
    CR2 --> AP1
    CR3 --> AP1
    CR4 --> AP1
    
    AP1 --> AP2
    AP2 --> AP3
    AP3 --> AP4
    
    AP4 --> RT1
    AP4 --> RT2
    AP4 --> RT3
    AP4 --> RT4
```

## WebSocket Communication Pattern

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Server
    participant CM as ComfyUI Manager
    participant CUI as ComfyUI Instance
    
    C->>WS: Connect WebSocket
    WS-->>C: Connection Established
    
    C->>WS: Subscribe to Generation
    WS->>CM: Register Client Interest
    
    CM->>CUI: Connect to ComfyUI WS
    CUI-->>CM: Progress Event
    CM->>WS: Relay Progress
    WS-->>C: Progress Update
    
    CUI-->>CM: Completion Event
    CM->>WS: Final Status
    WS-->>C: Generation Complete
    
    C->>WS: Disconnect
    WS->>CM: Unregister Client
```

## Error Handling Flow

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type?}
    
    B -->|Network| C[Retry with Backoff]
    B -->|Validation| D[Return 400 Error]
    B -->|Authentication| E[Return 401 Error]
    B -->|Server| F[Log & Return 500]
    B -->|Resource| G[Return 429 Error]
    
    C --> H{Max Retries?}
    H -->|No| I[Wait & Retry]
    H -->|Yes| J[Fail & Log]
    
    I --> K{Success?}
    K -->|Yes| L[Continue Process]
    K -->|No| H
    
    D --> M[Client Validation]
    E --> N[Re-authenticate]
    F --> O[Error Recovery]
    G --> P[Queue Request]
    J --> Q[Notify Admin]
    
    style A fill:#ffcdd2
    style L fill:#c8e6c9
    style Q fill:#fff3e0
```

## Security and Authentication Flow

```mermaid
graph TB
    subgraph "Client Authentication"
        CA1[Login Request]
        CA2[Token Validation]
        CA3[Session Management]
    end
    
    subgraph "API Security"
        AS1[Input Sanitization]
        AS2[Rate Limiting]
        AS3[CORS Handling]
        AS4[Error Sanitization]
    end
    
    subgraph "External Service Auth"
        ESA1[Vast.ai API Key]
        ESA2[SSH Key Management]
        ESA3[Database Credentials]
    end
    
    CA1 --> AS1
    CA2 --> AS2
    CA3 --> AS3
    
    AS1 --> ESA1
    AS2 --> ESA2
    AS3 --> ESA3
    
    style CA1 fill:#e3f2fd
    style AS1 fill:#f3e5f5
    style ESA1 fill:#fff8e1
```

## Performance Optimization Strategy

```mermaid
graph LR
    subgraph "Frontend Optimization"
        FO1[Component Caching]
        FO2[Lazy Loading]
        FO3[Image Optimization]
    end
    
    subgraph "Backend Optimization"
        BO1[Connection Pooling]
        BO2[Query Optimization]
        BO3[Caching Strategy]
    end
    
    subgraph "Infrastructure Optimization"
        IO1[Load Balancing]
        IO2[CDN Integration]
        IO3[Database Indexing]
    end
    
    FO1 --> BO1
    FO2 --> BO2
    FO3 --> BO3
    
    BO1 --> IO1
    BO2 --> IO2
    BO3 --> IO3
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        PE1[Load Balancer]
        PE2[Application Servers]
        PE3[Database Cluster]
        PE4[File Storage]
    end
    
    subgraph "External Infrastructure"
        EI1[Vast.ai Servers]
        EI2[ComfyUI Instances]
        EI3[Model Storage]
    end
    
    subgraph "Monitoring & Logging"
        ML1[Application Logs]
        ML2[Performance Metrics]
        ML3[Error Tracking]
        ML4[Audit Logs]
    end
    
    PE1 --> PE2
    PE2 --> PE3
    PE2 --> PE4
    
    PE2 --> EI1
    EI1 --> EI2
    EI2 --> EI3
    
    PE2 --> ML1
    PE2 --> ML2
    PE2 --> ML3
    PE2 --> ML4
    
    style PE1 fill:#e8f5e8
    style EI1 fill:#fff3e0
    style ML1 fill:#f3e5f5
```

This comprehensive flow chart documentation provides a complete visual representation of the system architecture, showing how ComfyUI, Vast.ai, and image generation components interact within the larger application ecosystem.