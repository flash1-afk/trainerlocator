# System Architecture V2 - With AI Avatar Integration

## ☁️ High-Level Cloud Infrastructure

This architecture diagram illustrates the complete flow of the TrainrLocator system, including the **new AI Avatar Training** fallback feature.

```mermaid
graph TB
    %% Nodes
    Client[📱 User Client <br> Web/Mobile PWA]
    
    subgraph "Backend Infrastructure"
        Gateway[🚪 API Gateway / Load Balancer]
        Server[⚙️ Node.js API Server]
        Auth[🔐 Auth Middleware]
        Search[🔍 Search Engine]
        
        subgraph "Services"
            BookingSvc[📅 Booking Service]
            AISvc[🤖 AI Avatar Service]
            PaymentSvc[💳 Payment Service]
        end
        
        DB[(🗄️ MongoDB Atlas)]
    end
    
    subgraph "External Integrations"
        Stripe[💰 Stripe/PayPal Gateway]
        GenAI[🧠 GenAI Model API <br> (OpenAI/Gemini)]
        LiveStream[📹 WebRTC Streaming Server]
    end

    %% Flow
    Client -- "HTTPS / Reqs" --> Gateway
    Gateway --> Auth
    Auth --> Server
    
    Server -- "Query Trainers" --> Search
    Search -- "Read Data" --> DB
    
    %% Standard Branch
    Search -- "Trainers Found" --> Client
    Client -- "Book Session" --> BookingSvc
    BookingSvc --> PaymentSvc
    PaymentSvc --> Stripe
    Stripe -- "Confirm" --> BookingSvc
    BookingSvc -- "Save" --> DB
    
    %% AI Fallback Branch
    Search -- "No Trainer Available" --> AISvc
    AISvc -- "Offer AI Session" --> Client
    Client -- "Accept AI" --> AISvc
    AISvc -- "Generate Workout Plan" --> GenAI
    GenAI -- "Workout Data" --> AISvc
    AISvc -- "Stream Avatar" --> LiveStream
    LiveStream -- "Video Feed" --> Client
    
    %% Style
    style Client fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style AISvc fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style GenAI fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style Search fill:#fff3e0,stroke:#e65100,stroke-width:2px
```

## 📐 Detailed Feature Explanation

### 1. The Core Flow
Users primarily interact with the **Search Engine** to find trainers based on location, specialization, and availability. The system queries the `Trainers` collection in MongoDB.

### 2. The Fallback Mechanism (New Feature)
If the `Search Engine` returns **0 results** for a specific user demand (e.g., "Yoga at 3 AM" or "Advanced Calisthenics in Remote Area"):
1.  The system identifies the "No Result" state.
2.  Instead of showing an empty list, it triggers the **AI Avatar Service**.
3.  The UI presents an option: *"No human trainer found. Would you like a session with our Virtual AI Coach?"*

### 3. AI Avatar Service Logic
This service acts as a bridge between our user data and Generative AI models.
*   **Input**: User's fitness goals, unavailable criteria (e.g., Yoga), and health profile.
*   **Process**: 
    *   Calls **GenAI Model API** to create a custom workout routine.
    *   Uses a **Text-to-Video/Animation** engine (or WebRTC stream of a 3D avatar) to visualize the workout.
*   **Output**: A live, interactive virtual session where a 3D Avatar demonstrates exercises.

### 4. Data Persistence
These sessions are stored in the database just like human sessions but with a specific flag:
*   `type: 'virtual-ai'`
*   `trainerId`: `null` (or a system "AI Trainer" ID)
*   `price`: Typically lower than human trainers or included in a subscription.

## 🔄 Updated Database Schema Implication

To support this, the `Session` model requires a minor update:
```javascript
const SessionSchema = new mongoose.Schema({
  // ... existing fields
  type: {
    type: String,
    enum: ['in-person', 'virtual', 'ai-avatar'], // Added 'ai-avatar'
    required: true
  },
  aiConfig: {
    avatarStyle: String, // e.g., 'Realistic', 'Cartoon'
    difficultyLevel: String,
    generatedRoutine: String // JSON string of the GenAI output
  }
});
```
