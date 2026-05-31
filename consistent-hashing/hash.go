package main

import "github.com/cespare/xxhash/v2"

func Hash(key string) uint32 {
	return uint32(xxhash.Sum64String(key))
}
