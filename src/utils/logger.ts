import * as core from "@actions/core";

export class Logger {
  static info(message: string): void {
    core.info(message);
  }

  static warning(message: string): void {
    core.warning(message);
  }

  static error(message: string): void {
    core.error(message);
  }

  static debug(message: string): void {
    core.debug(message);
  }

  static setFailed(message: string): void {
    core.setFailed(message);
  }
}
