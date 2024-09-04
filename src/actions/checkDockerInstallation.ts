import { Logger } from "../utils/logger";
import { execCommand } from "../utils/execCommand";

const checkDockerCommand = "command -v docker";
const downloadDockerScriptCommand = `curl -fsSL https://get.docker.com -o get-docker.sh`;
const runDockerScriptCommand = `sh get-docker.sh`;

export async function checkDockerInstallation(): Promise<void> {
  try {
    const isInstalled = await execCommand(checkDockerCommand);
    if (!isInstalled) {
      Logger.info("Docker is not installed. Installing Docker...");

      await execCommand(downloadDockerScriptCommand);
      await execCommand(runDockerScriptCommand);
      Logger.info("Docker installed successfully.");
    } else {
      Logger.info("Docker is already installed.");
    }
  } catch (error) {
    Logger.setFailed(
      `Failed to install Docker: ${
        error instanceof Error ? error.message : error
      }`
    );
    throw new Error(
      `Failed to install Docker: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}
