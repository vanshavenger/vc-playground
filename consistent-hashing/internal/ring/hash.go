package ring

import (
	"github.com/cespare/xxhash/v2"
)

func Hash(key string) uint64 {
	return xxhash.Sum64String(key)
}
