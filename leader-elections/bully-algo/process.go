package main

import (
	"sync"
	"time"

	"github.com/rs/zerolog/log"
)

// ProcessState is a type that represents the state of a process.
type processState int

const (
	// NormalState is a process state that represents a process that is not in an election.
	NormalState processState = iota
	// ElectionState is a process state that represents a process that is in an election.
	ElectionState
)

// Process is a struct that represents a process in a distributed system.
type Process struct {
	id            int
	isActive      bool
	isCoordinator bool
	state         processState
	ds            *DistributedSystem
	mutex         sync.Mutex
	electionTimer *time.Timer
	priority      int
}

func (p *Process) handleMessage(msg Message) {
	switch msg.Type {
	case Election:
		p.ds.messageQueue <- Message{
			Type:   Answer,
			FromID: p.id,
			ToID:   msg.FromID,
		}
		p.startElection()

	case Answer:
		if p.electionTimer != nil {
			p.electionTimer.Stop()
		}
		p.mutex.Lock()
		p.state = NormalState
		p.mutex.Unlock()

	case Coordinator:
		p.mutex.Lock()
		p.isCoordinator = false
		p.state = NormalState
		p.mutex.Unlock()
		log.Info().Msgf("Process %d acknowledges Process %d as coordinator", p.id, msg.FromID)
	}
}

func (p *Process) handleElectionTimeout() {
	p.mutex.Lock()
	if p.state != ElectionState {
		p.mutex.Unlock()
		return
	}
	p.mutex.Unlock()

	p.becomeCoordinator()
}

func (p *Process) becomeCoordinator() {
	p.mutex.Lock()
	p.isCoordinator = true
	p.state = NormalState
	p.mutex.Unlock()

	log.Info().Msgf("Process %d becoming coordinator", p.id)

	for _, proc := range p.ds.processes {
		if proc.id != p.id && proc.isActive {
			p.ds.messageQueue <- Message{
				Type:   Coordinator,
				FromID: p.id,
				ToID:   proc.id,
			}
		}
	}
}

func (p *Process) startElection() {
	p.mutex.Lock()
	if !p.isActive || p.state == ElectionState {
		p.mutex.Unlock()
		return
	}
	p.state = ElectionState
	p.mutex.Unlock()

	log.Info().Msgf("Process %d starting election", p.id)

	hasHigherProcess := false
	for _, proc := range p.ds.processes {
		if proc.id > p.id && proc.isActive && proc.priority > p.priority {
			hasHigherProcess = true
			p.ds.messageQueue <- Message{
				Type:   Election,
				FromID: p.id,
				ToID:   proc.id,
			}
		}
	}

	if !hasHigherProcess {
		p.becomeCoordinator()
		return
	}

	p.electionTimer = time.AfterFunc(4*time.Second, func() {
		p.handleElectionTimeout()
	})
}
