package main

import (
	"fmt"
	"vanshavenger/consistent-hashing/internal/ring"
)

func main() {
	router := ring.NewConsistentHashRouter(100)
	fmt.Printf("%+v\n", router)
}
