import { Logger } from "../utils/logger";
import { execCommand } from "../utils/execCommand";
import { getServiceNames } from "./getServiceNames";
import { CheckServicesOptions } from "../types";

const dockerPsCommand = (service: string) => `docker ps -q -f name=${service}`;
const inspectStatusCommand = (containerId: string) =>
  `docker inspect --format='{{.State.Status}}' ${containerId}`;
const inspectHealthCommand = (containerId: string) =>
  `docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' ${containerId}`;

const logAttemptMessage = (attempt: number, maxRetries: number) =>
  `-----------------------\nAttempt ${attempt} of ${maxRetries}`;

const logAttemptCompletedMessage = (
  attempt: number,
  maxRetries: number,
  retryInterval: number
) =>
  `Attempt ${attempt} completed, ${
    maxRetries - attempt
  } left. \nWaiting ${retryInterval} seconds for containers to become healthy. `;

const logNoServicesFoundMessage = "No services found";

const logNoRunningContainerMessage = (service: string) =>
  `No running container found for service: ${service}`;

const logSkippingContainerMessage = (service: string, containerId: string) =>
  `Skipping container ${service} because it is not running. Container: [${containerId}]`;

const logServiceStatusMessage = (
  service: string,
  containerId: string,
  status: string,
  health: string
) =>
  `Service: ${service}\n  Container: [${containerId}] | Status: [${status.toUpperCase()}] |  Health: [${health.toUpperCase()}]`;

const logSkippingNoHealthcheckMessage = (
  service: string,
  containerId: string,
  status: string,
  health: string
) =>
  `Skipping container ${service} without health check. Container: [${containerId}] | Status: [${status.toUpperCase()}] |  Health: [${health.toUpperCase()}]`;

const logServiceNotReadyMessage = (
  service: string,
  containerId: string,
  status: string,
  health: string
) =>
  `Service: ${service} is not ready.  Container: [${containerId}] | Status: [${status.toUpperCase()}] |  Health: [${health.toUpperCase()}]`;

const logErrorDuringServiceCheckMessage = (errorMessage: string) =>
  `Error during services check: ${errorMessage}`;

export async function checkServices(
  options: CheckServicesOptions
): Promise<boolean> {
  for (let i = 1; i <= options.maxRetries; i++) {
    Logger.info(logAttemptMessage(i, options.maxRetries));

    const allHealthy = await checkAllServices(options);

    if (allHealthy) {
      return true;
    }

    if (i < options.maxRetries) {
      Logger.info(
        logAttemptCompletedMessage(i, options.maxRetries, options.retryInterval)
      );
      await new Promise((resolve) =>
        setTimeout(resolve, options.retryInterval * 1000)
      );
    }
  }

  return false;
}

async function checkAllServices(
  options: CheckServicesOptions
): Promise<boolean> {
  try {
    const services = getServiceNames(options.composeFile);

    if (!services.length) {
      Logger.error(logNoServicesFoundMessage);
      return false;
    }

    let allHealthy = true;

    for (const service of services) {
      const containerIds = (await execCommand(dockerPsCommand(service)))
        .trim()
        .split("\n");

      if (containerIds.length === 0 || !containerIds[0].trim()) {
        if (!options.skipExited) {
          Logger.warning(logNoRunningContainerMessage(service));
          allHealthy = false;
        }
        continue;
      }

      for (const containerId of containerIds) {
        const status = await execCommand(inspectStatusCommand(containerId));

        if (status.trim() !== "running" && options.skipExited) {
          Logger.info(logSkippingContainerMessage(service, containerId));
          continue;
        }

        const health = await execCommand(inspectHealthCommand(containerId));

        Logger.info(
          logServiceStatusMessage(
            service,
            containerId,
            status.trim(),
            health.trim()
          )
        );

        if (health.trim() === "N/A" && options.skipNoHealthcheck) {
          Logger.warning(
            logSkippingNoHealthcheckMessage(
              service,
              containerId,
              status.trim(),
              health.trim()
            )
          );
          continue;
        }

        if (
          status.trim() !== "running" ||
          (health.trim() !== "healthy" && health.trim() !== "N/A")
        ) {
          Logger.warning(
            logServiceNotReadyMessage(
              service,
              containerId,
              status.trim(),
              health.trim()
            )
          );
          allHealthy = false;
        }
      }
    }

    return allHealthy;
  } catch (error) {
    Logger.setFailed(
      logErrorDuringServiceCheckMessage(
        error instanceof Error ? error.message : String(error)
      )
    );
    return false;
  }
}
