package main

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type processState int

const (
	normalState processState = iota
	electionState
)

type messageType string

const (
	election    messageType = "Election"
	answer      messageType = "Answer"
	coordinator messageType = "Coordinator"
)

type message struct {
	Type   messageType
	FromID int
	ToID   int
}

type process struct {
	id            int
	isActive      bool
	isCoordinator bool
	state         processState
	ds            *distributedSystem
	mutex         sync.Mutex
	electionTimer *time.Timer
}

type distributedSystem struct {
	processes    []*process
	messageQueue chan message
	mutex        sync.Mutex
}

func newDistributedSystem(numProcesses int) *distributedSystem {
	ds := &distributedSystem{
		messageQueue: make(chan message, 1000),
	}
	ds.newProcesses(numProcesses)
	return ds
}

func (ds *distributedSystem) newProcesses(numProcesses int) {
	for i := 0; i < numProcesses; i++ {
		proc := &process{
			id:            i + 1,
			isActive:      true,
			isCoordinator: false,
			state:         normalState,
			ds:            ds,
		}
		ds.processes = append(ds.processes, proc)
	}
}

func (ds *distributedSystem) simulateFailure(id int) {
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

func (ds *distributedSystem) recover(id int) {
	ds.mutex.Lock()
	process := ds.processes[id-1]
	ds.mutex.Unlock()

	if process != nil && !process.isActive {
		process.mutex.Lock()
		process.isActive = true
		process.isCoordinator = false
		process.state = normalState
		process.mutex.Unlock()

		log.Info().Msgf("Process %d recovered and starting election", id)
		process.startElection()
	}
}

func (p *process) startElection() {
	p.mutex.Lock()
	if !p.isActive || p.state == electionState {
		p.mutex.Unlock()
		return
	}
	p.state = electionState
	p.mutex.Unlock()

	log.Info().Msgf("Process %d starting election", p.id)

	hasHigherProcess := false
	for _, proc := range p.ds.processes {
		if proc.id > p.id && proc.isActive {
			hasHigherProcess = true
			p.ds.messageQueue <- message{
				Type:   election,
				FromID: p.id,
				ToID:   proc.id,
			}
		}
	}

	if !hasHigherProcess {
		p.becomeCoordinator()
		return
	}

	p.electionTimer = time.AfterFunc(2*time.Second, func() {
		p.handleElectionTimeout()
	})
}

func (p *process) handleMessage(msg message) {
	switch msg.Type {
	case election:
		p.ds.messageQueue <- message{
			Type:   answer,
			FromID: p.id,
			ToID:   msg.FromID,
		}
		p.startElection()

	case answer:
		if p.electionTimer != nil {
			p.electionTimer.Stop()
		}
		p.mutex.Lock()
		p.state = normalState
		p.mutex.Unlock()

	case coordinator:
		p.mutex.Lock()
		p.isCoordinator = false
		p.state = normalState
		p.mutex.Unlock()
		log.Info().Msgf("Process %d acknowledges Process %d as coordinator", p.id, msg.FromID)
	}
}

func (p *process) handleElectionTimeout() {
	p.mutex.Lock()
	if p.state != electionState {
		p.mutex.Unlock()
		return
	}
	p.mutex.Unlock()

	p.becomeCoordinator()
}

func (p *process) becomeCoordinator() {
	p.mutex.Lock()
	p.isCoordinator = true
	p.state = normalState
	p.mutex.Unlock()

	log.Info().Msgf("Process %d becoming coordinator", p.id)

	for _, proc := range p.ds.processes {
		if proc.id != p.id && proc.isActive {
			p.ds.messageQueue <- message{
				Type:   coordinator,
				FromID: p.id,
				ToID:   proc.id,
			}
		}
	}
}

func (ds *distributedSystem) timeoutDetection() {
	highestActive := ds.getHighestActiveProcess()
	if highestActive != nil {
		highestActive.startElection()
	}
}

func (ds *distributedSystem) getHighestActiveProcess() *process {
	var highest *process
	for _, p := range ds.processes {
		if p.isActive && (highest == nil || p.id > highest.id) {
			highest = p
		}
	}
	return highest
}

func (ds *distributedSystem) startMessageHandler() {
	go func() {
		for msg := range ds.messageQueue {
			if proc := ds.processes[msg.ToID-1]; proc != nil && proc.isActive {
				proc.handleMessage(msg)
			}
		}
	}()
}

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	output.FormatLevel = func(i interface{}) string {
		return strings.ToUpper(fmt.Sprintf("| %-6s|", i))
	}
	output.FormatMessage = func(i interface{}) string {
		return fmt.Sprintf("***%s****", i)
	}
	output.FormatFieldName = func(i interface{}) string {
		return fmt.Sprintf("%s:", i)
	}
	output.FormatFieldValue = func(i interface{}) string {
		return strings.ToUpper(fmt.Sprintf("%s", i))
	}
	log.Logger = zerolog.New(output).With().Timestamp().Logger()
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	ds := newDistributedSystem(5)
	ds.startMessageHandler()

	ds.processes[0].startElection()
	time.Sleep(3 * time.Second)

	ds.simulateFailure(5)
	time.Sleep(3 * time.Second)

	ds.recover(5)
	time.Sleep(3 * time.Second)
}
