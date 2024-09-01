import { Logger } from "../utils/logger";
import { execCommand } from "../utils/execCommand";

export async function checkDockerInstallation(): Promise<void> {
  try {
    const isInstalled = await execCommand("command -v docker");
    if (!isInstalled) {
      Logger.info("Docker is not installed. Installing Docker...");

      await execCommand(`curl -fsSL https://get.docker.com -o get-docker.sh`);
      await execCommand(`sh get-docker.sh`);
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
