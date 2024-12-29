package main

// MessageType is a type that represents the type of message that can be sent between processes.
type MessageType string

const (
	// Election is a message type that is sent when a process wants to start an election.
	Election MessageType = "Election"
	// Answer is a message type that is sent when a process wants to respond to an election message.
	Answer MessageType = "Answer"
	// Coordinator is a message type that is sent when a process wants to announce that it is the coordinator.
	Coordinator MessageType = "Coordinator"
)

// Message is a struct that represents a message that can be sent between processes.
type Message struct {
	Type   MessageType
	FromID int
	ToID   int
}
