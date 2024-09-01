import * as fs from "fs";
import * as yaml from "js-yaml";
import { Logger } from "../utils/logger";

export function getServiceNames(composeFilePath: string): string[] {
  const fileContents = fs.readFileSync(composeFilePath, "utf8");
  const data = yaml.load(fileContents) as { services: Record<string, unknown> };

  const serviceNames = Object.keys(data.services);

  Logger.info(
    `Checking ${serviceNames.length} container(s): ${serviceNames.join(
      ", "
    )}\n-----------------------\n`
  );

  return serviceNames;
}
