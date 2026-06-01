package ring

import (
	"strconv"
	"testing"
)

func BenchmarkGetServer(b *testing.B) {
	router := NewConsistentHashRouter(100)

	for i := 0; i < 100; i++ {
		router.AddServer(Server{
			ID:     "server" + strconv.Itoa(i),
			Weight: 1,
		})
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		router.GetServer(user)
	}
}

func BenchmarkGetServersReplication3(b *testing.B) {
	router := NewConsistentHashRouter(100)

	for i := 0; i < 100; i++ {
		router.AddServer(Server{
			ID:     "server" + strconv.Itoa(i),
			Weight: 1,
		})
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		user := "user" + "#" + strconv.Itoa(i)
		router.GetServers(user, 3)
	}
}

func BenchmarkAddServer(b *testing.B) {
	router := NewConsistentHashRouter(100)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		router.AddServer(Server{
			ID:     "server" + strconv.Itoa(i),
			Weight: 1,
		})
	}
}

func BenchmarkRemoveServer(b *testing.B) {
	for i := 0; i < b.N; i++ {
		router := NewConsistentHashRouter(100)

		router.AddServer(Server{
			ID:     "server",
			Weight: 1,
		})

		b.StartTimer()
		router.RemoveServer(Server{
			ID:     "server",
			Weight: 1,
		})
		b.StopTimer()
	}
}
