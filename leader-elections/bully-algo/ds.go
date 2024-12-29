package main

import (
	"sync"

	"github.com/rs/zerolog/log"
)

// DistributedSystem is a struct that represents a distributed system.
type DistributedSystem struct {
	processes    []*Process
	messageQueue chan Message
	mutex        sync.Mutex
}

// NewDistributedSystem is a function that creates a new distributed system with the given number of processes.
func NewDistributedSystem(numProcesses int) *DistributedSystem {
	ds := &DistributedSystem{
		messageQueue: make(chan Message, 1000),
	}
	ds.newProcesses(numProcesses)
	return ds
}

// NewProcesses is a function that creates a new processes in a distributed system.
func (ds *DistributedSystem) newProcesses(numProcesses int) {
	for i := 0; i < numProcesses; i++ {
		proc := &Process{
			id:            i + 1,
			isActive:      true,
			isCoordinator: false,
			state:         NormalState,
			ds:            ds,
		}
		ds.processes = append(ds.processes, proc)
	}
}

func (ds *DistributedSystem) recover(id int) {
	ds.mutex.Lock()
	process := ds.processes[id-1]
	ds.mutex.Unlock()

	if process != nil && !process.isActive {
		process.mutex.Lock()
		process.isActive = true
		process.isCoordinator = false
		process.state = NormalState
		process.mutex.Unlock()

		log.Info().Msgf("Process %d recovered and starting election", id)
		process.startElection()
	}
}

func (ds *DistributedSystem) simulateFailure(id int) {
	ds.mutex.Lock()
	defer ds.mutex.Unlock()

	process := ds.processes[id-1]
	if process != nil && process.isActive {
		process.isActive = false
		log.Info().Msgf("Process %d failed", id)

		if process.isCoordinator {
			log.Info().Msgf("Coordinator %d failed", id)
			ds.timeoutDetection()
		}
	}
}

func (ds *DistributedSystem) timeoutDetection() {
	highestActive := ds.getHighestActiveProcess()
	if highestActive != nil {
		highestActive.startElection()
	}
}

func (ds *DistributedSystem) getHighestActiveProcess() *Process {
	var highest *Process
	for _, p := range ds.processes {
		if p.isActive && (highest == nil || p.id > highest.id) {
			highest = p
		}
	}
	return highest
}

func (ds *DistributedSystem) startMessageHandler() {
	go func() {
		for msg := range ds.messageQueue {
			if proc := ds.processes[msg.ToID-1]; proc != nil && proc.isActive {
				proc.handleMessage(msg)
			}
		}
	}()
}
