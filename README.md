# ContainerOS prototype

The goal of the project is to provide as simple as possible interface for cluster deployments.

## Instalation
0. Install docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh && chmod +x get-docker.sh && ./get-docker.sh
```

1. Create swarm cluster
```bash
docker swarm init
```
2. Create `caddy` swarm overlay network
```bash
docker network create -d overlay --attachable caddy
```
3. Create secret `root_token` containing root token
```bash
printf "dev" | docker secret create root_token -
```
3. Create config `.env.api_host` containing your domain
```bash
printf "API_HOST=$(curl -4 ifconfig.co).nip.io\n" > .env.api_host
```
4. Copy .env.example to .env and set S3 credentials

5. Run installer
```bash
docker service rm containeros-system_api containeros-system_node-setup; docker pull quay.io/containeros/installer:latest && docker pull quay.io/containeros/api:latest && docker run --env-file .env --env-file .env.api_host -it --rm -v "/var/run/docker.sock:/var/run/docker.sock" quay.io/containeros/installer:latest
```
5. Optional: tear down
```bash
docker service rm $(docker service ls -q)
```

## Components

### Cluster API

- Accepts http requests and modifies swarm mode desired cluster state
- Responds with container statuses
- Streams logs
- Works directly with docker API
- Runs only on controller nodes
- Manages users saving them in configs and secrets
- Stateless except for log streaming

# Install container
- Starts router, API server, and docker registry and addon controllers

### Node management container
- Auth docker into registry

### Registry proxy

- Proxies requests to docker registry (thank you, capitain)
- Gets credentials and user access rights from configs and secrets

### Addon controlers 
- Manage databases and other software, defined in configs by API server
- Auto-scales depending on load
