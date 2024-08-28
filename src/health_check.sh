#!/bin/bash

set -e

max_retries=${INPUT_MAX_RETRIES:-30}
retry_interval=${INPUT_RETRY_INTERVAL:-10}
compose_file=${INPUT_COMPOSE_FILE:-"docker-compose.yml"}

echo "Max retries: $max_retries"
echo "Retry interval: $retry_interval"
echo "Compose file: $compose_file"

check_services() {
    local not_ready=false
    while read -r container_id; do
        if [ -z "$container_id" ]; then
            echo "No containers found. Is Docker Compose running?"
            return 1
        fi
        local status=$(docker inspect --format='{{.State.Status}}' "$container_id")
        local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' "$container_id")
        local name=$(docker inspect --format='{{.Name}}' "$container_id" | sed 's/^\///')
        
        echo "Checking container $name: Status=$status, Health=$health"
        
        if [[ "$status" != "running" ]] || [[ "$health" == "unhealthy" ]] || [[ "$health" == "starting" ]]; then
            echo "Container $name is not ready. Status: $status, Health: $health"
            not_ready=true
        fi
    done < <(docker compose -f "$compose_file" ps -q)

    if $not_ready; then
        return 1
    else
        return 0
    fi
}

for i in $(seq 1 $max_retries); do
    echo "Attempt $i of $max_retries"
    if ! check_services; then
        echo "Waiting for services to be ready... (Attempt $i/$max_retries)"
        sleep $retry_interval
    else
        echo "All services are ready!"
        exit 0
    fi
    if [ $i -eq $max_retries ]; then
        echo "Services did not become ready within the allocated time"
        docker compose -f "$compose_file" ps
        docker compose -f "$compose_file" logs
        exit 1
    fi
done