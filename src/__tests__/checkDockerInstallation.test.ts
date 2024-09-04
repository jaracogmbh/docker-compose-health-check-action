import { checkDockerInstallation } from "../actions/checkDockerInstallation";
import { Logger } from "../utils/logger";
import { execCommand } from "../utils/execCommand";

jest.mock("../utils/logger");
jest.mock("../utils/execCommand");

describe("checkDockerInstallation", () => {
  const mockExecCommand = execCommand as jest.Mock;

  const dockerCheckCommand = "command -v docker";
  const downloadDockerScriptCommand =
    "curl -fsSL https://get.docker.com -o get-docker.sh";
  const runDockerScriptCommand = "sh get-docker.sh";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log that Docker is already installed if command returns true", async () => {
    mockExecCommand.mockResolvedValue("docker");

    await checkDockerInstallation();

    expect(Logger.info).toHaveBeenCalledWith("Docker is already installed.");
  });

  it("should attempt to install Docker if not installed", async () => {
    mockExecCommand.mockResolvedValue("");

    await checkDockerInstallation();

    expect(Logger.info).toHaveBeenCalledWith(
      "Docker is not installed. Installing Docker..."
    );
    expect(execCommand).toHaveBeenCalledWith(downloadDockerScriptCommand);
    expect(execCommand).toHaveBeenCalledWith(runDockerScriptCommand);
    expect(Logger.info).toHaveBeenCalledWith("Docker installed successfully.");
  });

  it("should log an error and throw if installation fails", async () => {
    mockExecCommand.mockRejectedValue(new Error("Some error"));

    await expect(checkDockerInstallation()).rejects.toThrow(
      "Failed to install Docker: Some error"
    );
    expect(Logger.setFailed).toHaveBeenCalledWith(
      "Failed to install Docker: Some error"
    );
  });
});
