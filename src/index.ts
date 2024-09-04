import * as core from "@actions/core";
import { checkServices } from "./actions";
import { checkDockerInstallation } from "./actions";
import { Logger } from "./utils/logger";

async function run(): Promise<void> {
  try {
    const maxRetries: number = parseInt(
      process.env.INPUT_MAX_RETRIES || "30",
      10
    );
    const retryInterval: number = parseInt(
      process.env.INPUT_RETRY_INTERVAL || "10",
      10
    );
    const composeFile: string =
      process.env.INPUT_COMPOSE_FILE || "docker-compose.yml";
    const skipExited: boolean =
      (process.env.INPUT_SKIP_EXITED || "").toLowerCase() === "true";
    const skipNoHealthcheck: boolean =
      (process.env.INPUT_SKIP_NO_HEALTHCHECK || "").toLowerCase() === "true";

    Logger.info("Settings:");
    Logger.info(`  Max Retries: ${maxRetries}`);
    Logger.info(`  Retry Interval: ${retryInterval} seconds`);
    Logger.info(`  Compose File: ${composeFile}`);
    Logger.info(`  Skip Exited: ${skipExited}`);
    Logger.info(`  Skip No Healthcheck: ${skipNoHealthcheck}`);
    Logger.info(`-----------------------\n`);

    await checkDockerInstallation();

    const result = await checkServices({
      maxRetries,
      retryInterval,
      composeFile,
      skipExited,
      skipNoHealthcheck,
    });

    if (!result) {
      core.setFailed("Services did not become healthy within the time limit.");
    } else {
      core.info("\nAll services are healthy.\n");
    }
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(
        `This shouldn't happen. If you believe this is an action error - please open the issue. Error message: \n${error.message}`
      );
  }
}

run();
