package main

import "log"

type process struct {
    id            int
    isActive      bool
    isCoordinator *int
}

type distributedSystem struct {
    processes []*process
}

func (ds *distributedSystem) newProcesses(numProcesses int) {
    for i := 0; i < numProcesses; i++ {
        ds.processes = append(ds.processes, (&process{}).newProcess(i+1))
    }
}

func (ds *distributedSystem) simulateFailure(id int) {
    process := ds.processes[id-1]
    if process != nil {
        process.isActive = false
        log.Printf("Process %d failed", id)
        if ds.getCoordinator() != nil && id == *ds.getCoordinator() {
            log.Printf("Coordinator %d failed, Starting new election", id)
            ds.startNewElection()
        }
    }
}

func (ds *distributedSystem) startNewElection() {
    activeProcesses := ds.getActiveProcesses()
    if len(activeProcesses) == 0 {
        log.Println("No active processes")
        return
    }
    
    highestActive := activeProcesses[0]
    for _, p := range activeProcesses {
        if p.id > highestActive.id {
            highestActive = p
        }
    }
    
    highestActive.becomeCoordinator()
    
    for _, p := range activeProcesses {
        if p.id != highestActive.id {
            p.isCoordinator = &highestActive.id
        }
    }
    
    log.Printf("Election complete. Process %d is the new coordinator", highestActive.id)
}

func (ds *distributedSystem) getCoordinator() *int {
    for _, p := range ds.processes {
        if p.isActive && p.isCoordinator != nil {
            return p.isCoordinator
        }
    }
    return nil
}

func (ds *distributedSystem) getActiveProcesses() []*process {
    activeProcesses := []*process{}
    for _, p := range ds.processes {
        if p.isActive {
            activeProcesses = append(activeProcesses, p)
        }
    }
    return activeProcesses
}

func (p *process) newProcess(id int) *process {
    return &process{id: id, isActive: true, isCoordinator: nil}
}

func (p *process) becomeCoordinator() {
    log.Printf("Process %d becoming coordinator", p.id)
    p.isCoordinator = &p.id
}

func main() {
    ds := distributedSystem{}
    ds.newProcesses(5)
    
    coordinatorID := ds.getCoordinator()
    if coordinatorID == nil {
        log.Println("Initial coordinator: None")
    } else {
        log.Printf("Initial coordinator: %d", *coordinatorID)
    }
    
    ds.startNewElection()
    
    if coord := ds.getCoordinator(); coord != nil {
        log.Printf("Coordinator: %d", *coord)
    }
    
    ds.simulateFailure(3)
    
    if coord := ds.getCoordinator(); coord != nil {
        ds.simulateFailure(*coord)
    }
    
    if finalCoord := ds.getCoordinator(); finalCoord != nil {
        log.Printf("Final coordinator: %d", *finalCoord)
    } else {
        log.Println("Final coordinator: None")
    }
}