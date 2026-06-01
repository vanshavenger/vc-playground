package ring

import (
	"strconv"
	"testing"
)

func TestGetServerDeterministic(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	first := router.GetServer("user123")
	second := router.GetServer("user123")

	if first.ID != second.ID {
		t.Fatalf(
			"expected same server, got %s and %s",
			first.ID,
			second.ID,
		)
	}
}

func TestGetServersReturnsUniqueServers(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	servers := router.GetServers("user123", 3)

	if len(servers) != 3 {
		t.Fatalf(
			"expected 3 servers, got %d",
			len(servers),
		)
	}
}

func TestGetServerReturnsEmptyServerForEmptyRing(t *testing.T) {
	router := NewConsistentHashRouter(100)

	server := router.GetServer("user123")
	if server.ID != "" {
		t.Fatalf(
			"expected empty server, got %s",
			server.ID,
		)
	}
}

func TestGetServersReturnsNilForEmptyRing(t *testing.T) {
	router := NewConsistentHashRouter(100)

	serverSet := router.GetServers("user123", 3)

	if serverSet != nil {
		t.Fatalf(
			"expected 0 unique servers, got %d",
			len(serverSet),
		)
	}
}

func TestAddingServerCausesLimitedMovement(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	serverMapBefore := make(map[string]string)
	for i := 0; i < 1000; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		server := router.GetServer(user)
		serverMapBefore[user] = server.ID
	}

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	movedCount := 0
	for i := 0; i < 1000; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		server := router.GetServer(user)
		if server.ID != serverMapBefore[user] {
			movedCount++
		}
	}

	if movedCount > 400 {
		t.Fatalf(
			"expected less than 40%% of users to move, got %d",
			movedCount,
		)
	}
}

func TestRemovedServerNeverReturned(t *testing.T) {
	router := NewConsistentHashRouter(100)

	serverA := Server{
		ID:     "A",
		Weight: 1,
	}

	router.AddServer(serverA)

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	router.RemoveServer(serverA)

	for i := 0; i < 1000; i++ {
		user := "user" + "#" + strconv.Itoa(i)

		server := router.GetServer(user)
		if server.ID == "A" {
			t.Fatalf(
				"expected no users to be assigned to removed server A, but got user %s assigned to A",
				user,
			)
		}

		servers := router.GetServers(user, 2)
		for _, s := range servers {
			if s.ID == "A" {
				t.Fatalf(
					"expected no users to be assigned to removed server A in GetServers, but got user %s assigned to A",
					user,
				)
			}
		}
	}
}

func TestReplicationFactorGreaterThanServerCount(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	serverSet := router.GetServers("user123", 5)

	if len(serverSet) != 3 {
		t.Fatalf(
			"expected 3 unique servers, got %d",
			len(serverSet),
		)
	}
}

func TestReplicationFactorOneMatchesGetServer(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	for i := 0; i < 1000; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		single := router.GetServer(user)
		multi := router.GetServers(user, 1)

		if len(multi) != 1 || multi[0].ID != single.ID {
			t.Fatalf(
				"expected GetServer and GetServers(..., 1) to match for user %s",
				user,
			)
		}
	}
}

func TestReplicationOrderIsDeterministic(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	first := router.GetServers(
		"user123",
		3,
	)

	second := router.GetServers(
		"user123",
		3,
	)

	if len(first) != len(second) {
		t.Fatalf(
			"expected same number of servers, got %d and %d",
			len(first),
			len(second),
		)
	}

	for i := range first {
		if first[i].ID != second[i].ID {
			t.Fatalf(
				"expected same server at position %d, got %s and %s",
				i,
				first[i].ID,
				second[i].ID,
			)
		}
	}
}

func TestWeightedOwnershipDistribution(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 5,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	countA := 0
	countB := 0
	for i := 0; i < 10000; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		server := router.GetServer(user)
		if server.ID == "A" {
			countA++
		} else if server.ID == "B" {
			countB++
		}
	}

	if countA <= countB {
		t.Fatalf(
			"expected A to own much more than B, got A: %d, B: %d",
			countA, countB,
		)
	}
}

func TestWeightedNodeMovementMatchesExpectedWeight(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 5,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 4,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 3,
	})

	router.AddServer(Server{
		ID:     "D",
		Weight: 2,
	})

	serverMapBefore := make(map[string]string)
	for i := 0; i < 10000; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		server := router.GetServer(user)
		serverMapBefore[user] = server.ID
	}

	router.AddServer(Server{
		ID:     "E",
		Weight: 1,
	})

	movedCount := 0
	for i := 0; i < 10000; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		server := router.GetServer(user)
		if server.ID != serverMapBefore[user] {
			movedCount++
		}
	}

	percentage := float64(movedCount) / 10000.0
	if percentage < 0.01 || percentage > 0.15 {
		t.Fatalf(
			"expected movement between 1%% and 15%% (theoretically ~6.6%%), got %f%%",
			percentage*100,
		)
	}
}

func TestRingPositionsRemainSorted(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	for i := 1; i < len(router.positions); i++ {
		if router.positions[i] < router.positions[i-1] {
			t.Fatalf(
				"expected ring positions to be sorted, but position %d is less than position %d",
				i,
				i-1,
			)
		}
	}
}

func TestRingAndPositionCountMatch(t *testing.T) {
	router := NewConsistentHashRouter(100)

	serverA := Server{
		ID:     "A",
		Weight: 1,
	}

	router.AddServer(serverA)

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	expectedVirtualNodeCount := 2 * 100
	if len(router.ring) != expectedVirtualNodeCount {
		t.Fatalf(
			"expected ring to have %d virtual nodes, got %d",
			expectedVirtualNodeCount,
			len(router.ring),
		)
	}
	if len(router.positions) != expectedVirtualNodeCount {
		t.Fatalf(
			"expected positions to have %d entries, got %d",
			expectedVirtualNodeCount,
			len(router.positions),
		)
	}

	router.RemoveServer(serverA)
	expectedVirtualNodeCountAfterRemove := 1 * 100
	if len(router.ring) != expectedVirtualNodeCountAfterRemove {
		t.Fatalf(
			"expected ring to have %d virtual nodes after remove, got %d",
			expectedVirtualNodeCountAfterRemove,
			len(router.ring),
		)
	}
	if len(router.positions) != expectedVirtualNodeCountAfterRemove {
		t.Fatalf(
			"expected positions to have %d entries after remove, got %d",
			expectedVirtualNodeCountAfterRemove,
			len(router.positions),
		)
	}
}

func TestConcurrentReads(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	done := make(chan struct{})
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 1000; j++ {
				user := "user" + "#" + strconv.Itoa(j)
				router.GetServer(user)
			}
			done <- struct{}{}
		}()
	}

	for i := 0; i < 10; i++ {
		<-done
	}
}

func TestConcurrentReadsAndWrites(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	done := make(chan struct{})
	go func() {
		for i := 0; i < 1000; i++ {
			user := "user" + "#" + strconv.Itoa(i)
			router.GetServer(user)
		}
		done <- struct{}{}
	}()

	go func() {
		for i := 0; i < 1000; i++ {
			router.AddServer(Server{
				ID:     "B" + strconv.Itoa(i),
				Weight: 1,
			})
		}
		done <- struct{}{}
	}()

	for i := 0; i < 2; i++ {
		<-done
	}
}

func TestReplicationFactorZero(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	serverSet := router.GetServers("user123", 0)

	if serverSet != nil {
		t.Fatalf(
			"expected nil server set for replication factor 0, got %d servers",
			len(serverSet),
		)
	}
}

func TestReplicationFactorNegative(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "B",
		Weight: 1,
	})

	router.AddServer(Server{
		ID:     "C",
		Weight: 1,
	})

	serverSet := router.GetServers("user123", -1)

	if serverSet != nil {
		t.Fatalf(
			"expected nil server set for negative replication factor, got %d servers",
			len(serverSet),
		)
	}
}

func TestSingleServerReplication(t *testing.T) {
	router := NewConsistentHashRouter(100)

	router.AddServer(Server{
		ID:     "A",
		Weight: 1,
	})

	serverSet := router.GetServers("user123", 3)

	if len(serverSet) != 1 || serverSet[0].ID != "A" {
		t.Fatalf(
			"expected 1 server when only 1 server in ring, got %d",
			len(serverSet),
		)
	}
}
