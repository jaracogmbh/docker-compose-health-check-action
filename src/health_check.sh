#!/bin/bash

set -e

max_retries=${INPUT_MAX_RETRIES:-30}
retry_interval=${INPUT_RETRY_INTERVAL:-10}
compose_file=${INPUT_COMPOSE_FILE:-"docker-compose.yml"}

log() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $1"
}

log_error() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp ERROR] $1" >&2
}

log "Starting Docker Compose Health Check"
log "Max retries: $max_retries"
log "Retry interval: $retry_interval seconds"
log "Compose file: $compose_file"

check_services() {
    local not_ready=false
    while read -r container_id; do
        if [ -z "$container_id" ]; then
            log_error "No containers found. Is Docker Compose running?"
            return 1
        fi
        local status=$(docker inspect --format='{{.State.Status}}' "$container_id")
        local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' "$container_id")
        local name=$(docker inspect --format='{{.Name}}' "$container_id" | sed 's/^\///')
        
        log "Checking container $name: Status=$status, Health=$health"
        
        if [[ "$status" != "running" ]] || [[ "$health" != "healthy" && "$health" != "N/A" ]]; then
            log_error "Container $name is not ready. Status: $status, Health: $health"
            not_ready=true
        fi
    done < <(docker-compose -f "$compose_file" ps -q)

    if $not_ready; then
        return 1
    else
        return 0
    fi
}

for i in $(seq 1 $max_retries); do
    log "Attempt $i of $max_retries"
    if ! check_services; then
        log "Waiting for services to be ready... (Attempt $i/$max_retries)"
        sleep $retry_interval
    else
        log "All services are ready!"
        log "Current Docker container status:"
        docker-compose -f "$compose_file" ps
        exit 0
    fi
    if [ $i -eq $max_retries ]; then
        log_error "Services did not become ready within the allocated time"
        log_error "Docker Compose status:"
        docker-compose -f "$compose_file" ps
        log_error "Docker Compose logs:"
        docker-compose -f "$compose_file" logs
        exit 1
    fi
done