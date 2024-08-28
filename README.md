Docker Compose Health Check Action

# Docker Compose Health Check Action

This GitHub Action checks the health status of services started by Docker Compose.

## Usage

```yaml
- uses: krystianslowik/docker-compose-health-check-action@v1
  with:
    max-retries: 30
    retry-interval: 10
    compose-file: "docker-compose.yml"
```

## Inputs

| Input            | Description                         | Required | Default            |
| ---------------- | ----------------------------------- | -------- | ------------------ |
| `max-retries`    | Maximum number of retry attempts    | No       | 30                 |
| `retry-interval` | Interval between retries in seconds | No       | 10                 |
| `compose-file`   | Path to the docker-compose file     | No       | docker-compose.yml |

## Prerequisites

- This action requires Docker to be installed on the runner
- It's designed to work alongside Docker Compose
- Services in your Docker Compose file should have health checks defined

## How it works

This action will:

1.  Check the status of all services defined in the Docker Compose file
2.  Retry the check based on the specified `max-retries` and `retry-interval`
3.  Exit successfully if all services become healthy within the given attempts
4.  Fail if any service doesn't become healthy within the maximum retry attempts

## Example workflow

```yaml
name: CI
on: [push]
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker compose up -d
      - name: Check service health
        uses: krystianslowik/docker-compose-health-check-action@v1
        with:
          max-retries: 20
          retry-interval: 5
      - name: Run tests
        run: ./run_tests.sh
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
