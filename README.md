<img src="assets/logo.png" alt="Docker Compose Health Check Logo" width="128">

# Docker Compose Health Check Action

This GitHub Action checks the health status of services started by Docker Compose, ensuring they are fully operational before proceeding with subsequent steps in your workflow.

## Features

- Checks the health status of Docker containers
- Configurable retry attempts and intervals
- Option to skip exited containers
- Option to skip containers without health checks

## Compatibility:

This action is compatible with:

- **Ubuntu:** `ubuntu-latest` (Linux-x86_64)

## Pre-requisites

- GitHub Actions runner with Docker installed. If not installed, it will be installed automatically.
- A `docker-compose.yml` file in your repository
- Services in your Docker Compose file should ideally have health checks defined.

## Usage

```yaml
- uses: jaracogmbh/docker-compose-health-check-action@v1.0.0
  with:
    max-retries: 30
    retry-interval: 10
    compose-file: "docker-compose.yml"
    skip-exited: "true"
    skip-no-healthcheck: "true"
```

## Inputs

| Input                 | Description                                    | Required | Default            |
| --------------------- | ---------------------------------------------- | -------- | ------------------ |
| `max-retries`         | Maximum number of retry attempts               | No       | 30                 |
| `retry-interval`      | Interval between retries in seconds            | No       | 10                 |
| `compose-file`        | Path to the docker-compose file                | No       | docker-compose.yml |
| `skip-exited`         | Skip checking exited containers                | No       | false              |
| `skip-no-healthcheck` | Skip checking containers without health checks | No       | false              |

## How it works

1.  The action first checks if Docker Compose is installed on the runner. If not, it automatically installs it.
2.  It then reads the specified Docker Compose file and checks the status of all defined services.
3.  For each service, it checks:
    - If the container is running
    - If the container has a health check, whether it's healthy
4.  The action will retry the checks based on the specified `max-retries` and `retry-interval`.
5.  It will exit successfully if all services become healthy within the given attempts.
6.  If any service doesn't become healthy within the maximum retry attempts, the action will fail.

## Example workflow

```yaml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start Docker Compose services
        run: docker-compose up -d

      - name: Check service health
        uses: jaracogmbh/docker-compose-health-check-action@v1.0.0
        with:
          max-retries: 30
          retry-interval: 10
          compose-file: "docker-compose.yml"
          skip-exited: "true"
          skip-no-healthcheck: "true"

      - name: Run tests
        run: ./run_tests.sh
```

## Best Practices

1.  **Define health checks**: For best results, define health checks for your services in the Docker Compose file. This allows the action to accurately determine when a service is fully operational.
2.  **Set appropriate retry values**: Adjust `max-retries` and `retry-interval` based on your services' typical startup time to avoid unnecessary waiting or premature timeouts.
3.  **Use `skip-exited` for initialization containers**: If you have containers that are meant to run once and exit (like database initializers), use the `skip-exited` option.
4.  **Use `skip-no-healthcheck` judiciously**: While skipping containers without health checks can speed up the process, ensure that these containers are truly ready when the main health check passes.

## Troubleshooting

If the action is failing, check the following:

1.  Ensure your `docker-compose.yml` file is correctly formatted and all services are defined properly.
2.  Verify that the services have appropriate health checks defined.
3.  Check the logs of your services to see if there are any startup issues.
4.  Increase `max-retries` or `retry-interval` if your services take longer to start up.

<div><img src="assets/jaraco_logo_software_engineer.png" width="200px" align="right"></div>
