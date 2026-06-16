# System State Diagrams

## 1. Booking State Machine

This diagram represents the lifecycle of a `Booking` entity, including its interaction with the `Payment` status.

```mermaid
stateDiagram-v2
    [*] --> Pending: Booking Created
    
    state "Pending" as Pending {
        [*] --> AwaitingPayment
        AwaitingPayment --> PaymentFailed: Payment Rejected
        PaymentFailed --> AwaitingPayment: Retry
        AwaitingPayment --> PaymentSuccess: Payment Authorized
    }

    Pending --> Confirmed: Payment Successful
    Pending --> Cancelled: User Cancel / Timeout

    State Confirmed {
       [*] --> Scheduled
    }
    
    Confirmed --> Cancelled: User Cancel (Policy Check)
    Confirmed --> Completed: Sessions Finished
    
    Cancelled --> Refunded: Refund Processed
    Refunded --> [*]
    Completed --> [*]

    note right of Confirmed
        User can cancel checks:
        - Hours before session > Policy
    end note
```

### Detailed Booking Transitions
| Current State | Event | New State | Condition |
|--------------|-------|-----------|-----------|
| `[*]` | Create Booking | `Pending` | User selects trainer & service |
| `Pending` | Payment Success | `Confirmed` | Payment gateway confirmation |
| `Pending` | Payment Fail | `Pending` | Retry allowed |
| `Pending` | Cancel | `Cancelled` | User aborts or timeout |
| `Confirmed` | Cancel | `Cancelled` | `canBeCancelled()` returns true |
| `Confirmed` | Complete | `Completed` | All sessions done |

---

## 2. Session Lifecycle

This diagram tracks the status of individual training sessions within a booking.

```mermaid
stateDiagram-v2
    [*] --> Scheduled: Session Created
    
    Scheduled --> InProgress: Session Start Time
    Scheduled --> Cancelled: Booking Cancelled
    Scheduled --> NoShow: User/Trainer Missing
    
    InProgress --> Completed: Session End Time
    
    Completed --> [*]
    Cancelled --> [*]
    NoShow --> [*]

    note right of Scheduled
        Reminders sent:
        - Email/SMS
        - Push
    end note
```

### Session State Transitions
| Current State | Event | New State | Notes |
|--------------|-------|-----------|-------|
| `[*]` | Booking Confirmed | `Scheduled` | created via `sessions` array |
| `Scheduled` | Time Arrives | `In-Progress` | |
| `Scheduled` | Cancellation | `Cancelled` | Propagates from Booking or individual reschedule |
| `Scheduled` | Absence | `No-Show` | Marked by Trainer |
| `In-Progress`| Fnishes | `Completed` | |

---

## 3. Payment State Flow

Focuses strictly on the financial transaction aspect of a Booking.

```mermaid
stateDiagram-v2
    [*] --> Pending: Init Transaction
    
    Pending --> Paid: Gateway Success
    Pending --> Failed: Gateway Error
    
    Paid --> Refunded: Booking Cancelled (Eligible)
    
    Failed --> Pending: Retry w/ New Method
    
    Refunded --> [*]
```
