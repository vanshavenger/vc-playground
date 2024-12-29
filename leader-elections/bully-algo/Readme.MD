# Bully Algorithm Implementation for Leader Election

## Overview
This repository contains an implementation of the Bully Algorithm, a method for dynamically electing a coordinator in a distributed system. The algorithm assumes that each process has a unique ID, and the process with the highest ID becomes the leader.

## Getting Started
```bash
# Clone the repository
git clone 

# Run the coordinator
go run *.go

```

## Algorithm Description
The Bully Algorithm works as follows:

1. **Initial State**: Each process has a unique ID and knows the IDs of all other processes
2. **Election Trigger**: When a process P detects coordinator failure, it initiates an election:
    - Sends ELECTION message to all processes with higher IDs
    - If no response, P becomes the coordinator
    - If receives OK, P waits for coordinator announcement

### Example Scenario:
Consider 4 processes with IDs: P1, P2, P3, P4
```
Initial state: P4 is coordinator
P4 fails
P2 detects failure and starts election
P2 sends ELECTION to P3, P4
P3 responds with OK
P3 sends ELECTION to P4
No response from P4
P3 becomes new coordinator
P3 sends COORDINATOR message to all
```

## Rules of Bully Algorithm
1. **Process Priority**: Higher ID processes can bully lower ID processes
2. **Response Requirements**: Processes must respond to ELECTION messages
3. **Coordinator Announcement**: New coordinator broadcasts its status
4. **Multiple Elections**: Algorithm handles concurrent elections
5. **Fault Tolerance**: Continues working if processes fail during election

## Message Types
- `ELECTION`: Initiates election process
- `ANSWER`: Response to ELECTION message
- `COORDINATOR`: Announces new leader

## Dependencies
- Go 


