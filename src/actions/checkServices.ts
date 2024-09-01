import { Logger } from "../utils/logger";
import { execCommand } from "../utils/execCommand";
import { getServiceNames } from "./getServiceNames";
import { CheckServicesOptions } from "../types";

export async function checkServices(
  options: CheckServicesOptions
): Promise<boolean> {
  for (let i = 1; i <= options.maxRetries; i++) {
    Logger.info(
      `\n-----------------------\nAttempt ${i} of ${options.maxRetries}`
    );

    const allHealthy = await checkAllServices(options);

    if (allHealthy) {
      return true;
    }

    if (i < options.maxRetries) {
      Logger.info(
        `\nAttempt ${i} completed, ${options.maxRetries - i} left. \nWaiting ${
          options.retryInterval
        } seconds for containers to become healthy. \n`
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
      Logger.error("No services found");
      return false;
    }

    let allHealthy = true;

    for (const service of services) {
      const containerIds = (
        await execCommand(`docker ps -q -f name=${service}`)
      )
        .trim()
        .split("\n");

      if (containerIds.length === 0 || !containerIds[0].trim()) {
        if (!options.skipExited) {
          Logger.warning(
            `No running container found for service: ${service}\n`
          );
          allHealthy = false;
        }
        continue;
      }

      for (const containerId of containerIds) {
        const status = await execCommand(
          `docker inspect --format='{{.State.Status}}' ${containerId}`
        );

        if (status.trim() !== "running" && options.skipExited) {
          Logger.info(
            `Skipping container ${service} because it is not running. Container: [${containerId}]\n`
          );
          continue;
        }

        const health = await execCommand(
          `docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' ${containerId}`
        );

        Logger.info(
          `Service: ${service}\n  Container: [${containerId}] | Status: [${status
            .trim()
            .toUpperCase()}] |  Health: [${health.trim().toUpperCase()}]\n`
        );

        if (health.trim() === "N/A" && options.skipNoHealthcheck) {
          Logger.warning(
            `Skipping container ${service} without health check. Container: [${containerId}] | Status: [${status
              .trim()
              .toUpperCase()}] |  Health: [${health.trim().toUpperCase()}]\n`
          );
          continue;
        }

        if (
          status.trim() !== "running" ||
          (health.trim() !== "healthy" && health.trim() !== "N/A")
        ) {
          Logger.warning(
            `Service: ${service} is not ready.  Container: [${containerId}] | Status: [${status
              .trim()
              .toUpperCase()}] |  Health: [${health.trim().toUpperCase()}]\n`
          );
          allHealthy = false;
        }
      }
    }

    return allHealthy;
  } catch (error) {
    Logger.setFailed(
      `\nError during services check: ${
        error instanceof Error ? error.message : error
      }`
    );
    return false;
  }
}
