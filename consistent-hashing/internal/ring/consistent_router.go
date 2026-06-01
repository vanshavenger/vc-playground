package ring

import (
	"fmt"
	"math"
	"slices"
	"strconv"
	"sync"
)

type ConsistentHashRouter struct {
	mu sync.RWMutex

	ring         map[uint64]Server
	positions    []uint64
	virtualNodes int
}

func NewConsistentHashRouter(virtualNodes int) *ConsistentHashRouter {
	return &ConsistentHashRouter{
		ring:         make(map[uint64]Server),
		positions:    make([]uint64, 0),
		virtualNodes: virtualNodes,
	}
}

func (r *ConsistentHashRouter) AddServer(server Server) {
	r.mu.Lock()
	defer r.mu.Unlock()

	virtualNodeCount := r.virtualNodes * server.Weight

	for i := 0; i < virtualNodeCount; i++ {
		virtualNodeKey := server.ID + "#" + strconv.Itoa(i)
		virtualNodePosition := Hash(virtualNodeKey)

		r.ring[virtualNodePosition] = server

		idx, _ := slices.BinarySearch(r.positions, virtualNodePosition)
		if idx < len(r.positions) && r.positions[idx] == virtualNodePosition {
			continue
		}

		r.positions = slices.Insert(
			r.positions,
			idx,
			virtualNodePosition,
		)
	}
}

func (r *ConsistentHashRouter) PrintRing() {

	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, pos := range r.positions {
		fmt.Printf(
			"%d -> %s\n",
			pos,
			r.ring[pos].ID,
		)
	}
}

func (r *ConsistentHashRouter) GetServer(user string) Server {
	r.mu.RLock()
	defer r.mu.RUnlock()
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
	r.mu.Lock()
	defer r.mu.Unlock()
	virtualNodeCount := r.virtualNodes * server.Weight

	for i := 0; i < virtualNodeCount; i++ {
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

	r.mu.RLock()
	defer r.mu.RUnlock()
	if len(r.positions) == 0 {
		return
	}

	ownership := map[string]float64{}

	for i, pos := range r.positions {
		prevIndex := (i - 1 + len(r.positions)) % len(r.positions)
		prevPos := r.positions[prevIndex]

		var diff uint64
		if pos > prevPos {
			diff = pos - prevPos
		} else {
			diff = (0xFFFFFFFFFFFFFFFF - prevPos) + pos + 1
		}

		var HashSpace = float64(math.MaxUint64) + 1

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

func (r *ConsistentHashRouter) GetServers(
	user string,
	replicationFactor int,
) []Server {

	r.mu.RLock()
	defer r.mu.RUnlock()

	if len(r.ring) == 0 || replicationFactor <= 0 {
		return nil
	}

	userHash := Hash(user)

	idx, _ := slices.BinarySearch(r.positions, userHash)
	if idx == len(r.positions) {
		idx = 0
	}

	servers := make([]Server, 0, replicationFactor)
	seen := make(map[string]struct{})

	for i := 0; len(servers) < replicationFactor && i < len(r.positions); i++ {
		pos := r.positions[(idx+i)%len(r.positions)]
		server := r.ring[pos]

		if _, exists := seen[server.ID]; !exists {
			servers = append(servers, server)
			seen[server.ID] = struct{}{}
		}
	}

	return servers
}
