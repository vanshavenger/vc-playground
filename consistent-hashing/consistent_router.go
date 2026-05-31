package main

import (
	"fmt"
	"slices"
	"strconv"
)

type ConsistentHashRouter struct {
	ring         map[uint32]Server
	positions    []uint32
	virtualNodes int
}

func NewConsistentHashRouter(virtualNodes int) *ConsistentHashRouter {
	return &ConsistentHashRouter{
		ring:         make(map[uint32]Server),
		positions:    make([]uint32, 0),
		virtualNodes: virtualNodes,
	}
}

func (r *ConsistentHashRouter) AddServer(server Server) {
	for i := 0; i < r.virtualNodes; i++ {
		virtualNodeKey := server.ID + "#" + strconv.Itoa(i)
		virtualNodePosition := Hash(virtualNodeKey)
		r.ring[virtualNodePosition] = server
		r.positions = append(r.positions, virtualNodePosition)
	}

	slices.Sort(r.positions)
}

func (r *ConsistentHashRouter) PrintRing() {

	for _, pos := range r.positions {
		fmt.Printf(
			"%d -> %s\n",
			pos,
			r.ring[pos].ID,
		)
	}
}

func (r *ConsistentHashRouter) GetServer(user string) Server {
	if len(r.ring) == 0 {
		return Server{}
	}
	userHash := Hash(user)

	idx, _ := slices.BinarySearch(r.positions, userHash)
	if idx == len(r.positions) {
		idx = 0
	}
	selectedPosition := r.positions[idx]
	return r.ring[selectedPosition]
}

func (r *ConsistentHashRouter) RemoveServer(server Server) {
	for i := 0; i < r.virtualNodes; i++ {
		virtualNodeKey := server.ID + "#" + strconv.Itoa(i)
		virtualNodePosition := Hash(virtualNodeKey)
		delete(r.ring, virtualNodePosition)

		idx, _ := slices.BinarySearch(r.positions, virtualNodePosition)
		if idx < len(r.positions) && r.positions[idx] == virtualNodePosition {
			r.positions = append(r.positions[:idx], r.positions[idx+1:]...)
		}
	}
}

func (r *ConsistentHashRouter) PrintOwnership() {
	if len(r.positions) == 0 {
		return
	}

	ownership := map[string]float64{}

	for i, pos := range r.positions {
		prevIndex := (i - 1 + len(r.positions)) % len(r.positions)
		prevPos := r.positions[prevIndex]

		var diff uint32
		if pos > prevPos {
			diff = pos - prevPos
		} else {
			diff = (0xFFFFFFFF - prevPos) + pos + 1
		}

		const HashSpace = float64(uint64(1) << 32)

		percentage := float64(diff) / HashSpace * 100

		ownership[r.ring[pos].ID] += percentage
	}

	for server, pct := range ownership {
		fmt.Printf(
			"%s owns %.2f%%\n",
			server,
			pct,
		)
	}
}
