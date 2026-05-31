package main

type Router struct {
	servers []Server
}

func NewRouter(servers []Server) *Router {
	return &Router{
		servers: servers,
	}
}

func (r *Router) GetServer(
	user string,
) string {

	server :=
		r.servers[int(Hash(user))%len(r.servers)]

	return server.ID
}

func (r *Router) AddServer(server Server) {
	r.servers = append(r.servers, server)
}
