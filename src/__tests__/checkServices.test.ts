import { checkServices } from "../actions/checkServices";
import { Logger } from "../utils/logger";
import * as execCommandModule from "../utils/execCommand";
import * as getServiceNamesModule from "../actions/getServiceNames";

jest.mock("../utils/logger");
jest.mock("../utils/execCommand");
jest.mock("../actions/getServiceNames");

describe("checkServices", () => {
  const mockExecCommand = execCommandModule.execCommand as jest.Mock;
  const mockGetServiceNames =
    getServiceNamesModule.getServiceNames as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true if all services are healthy", async () => {
    mockGetServiceNames.mockReturnValue(["service1"]);
    mockExecCommand
      .mockResolvedValueOnce("running")
      .mockResolvedValueOnce("healthy");

    const result = await checkServices({
      maxRetries: 1,
      retryInterval: 1,
      composeFile: "docker-compose.yml",
      skipExited: true,
      skipNoHealthcheck: true,
    });

    expect(result).toBe(true);
  });
});
