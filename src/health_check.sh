#!/bin/bash

set -e

max_retries=${1:-30}
retry_interval=${2:-10}
compose_file=${3:-"docker-compose.yml"}

log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') $1"
}

check_services() {
    if ! docker-compose -f "$compose_file" ps --services --filter "status=running" | grep -q .; then
        log "No services are running"
        return 1
    fi

    local not_ready=false
    while read -r service; do
        local container_id=$(docker-compose -f "$compose_file" ps -q $service)
        local status=$(docker inspect --format='{{.State.Status}}' "$container_id")
        local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' "$container_id")
        
        log "Checking service $service: Status=$status, Health=$health"
        
        if [[ "$status" != "running" ]] || [[ "$health" != "healthy" && "$health" != "N/A" ]]; then
            log "Service $service is not ready. Status: $status, Health: $health"
            not_ready=true
        fi
    done < <(docker-compose -f "$compose_file" ps --services)

    if $not_ready; then
        return 1
    else
        return 0
    fi
}

log "Starting Docker Compose Health Check"
log "Max retries: $max_retries"
log "Retry interval: $retry_interval seconds"
log "Compose file: $compose_file"

for i in $(seq 1 $max_retries); do
    log "Attempt $i of $max_retries"
    if ! check_services; then
        log "Waiting for services to be ready... (Attempt $i/$max_retries)"
        sleep $retry_interval
    else
        log "All services are ready!"
        docker-compose -f "$compose_file" ps
        exit 0
    fi
    if [ $i -eq $max_retries ]; then
        log "Services did not become ready within the allocated time"
        docker-compose -f "$compose_file" ps
        docker-compose -f "$compose_file" logs
        exit 1
    fi
done