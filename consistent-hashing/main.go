package main

import "fmt"

func main() {

	router := NewConsistentHashRouter(100)

	router.AddServer(Server{ID: "ServerA"})
	router.AddServer(Server{ID: "ServerB"})
	router.AddServer(Server{ID: "ServerC"})
	router.AddServer(Server{ID: "ServerD"})

	router.PrintRing()

	fmt.Println()

	fmt.Println(len(router.positions))
	fmt.Println(len(router.ring))

	users := make([]string, 10000)

	for i := 0; i < 10000; i++ {
		users[i] = fmt.Sprintf("user-%d", i)
	}

	router.PrintOwnership()
}
