import { exec } from "child_process";

export async function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Command failed: ${stderr || error.message}`);
      } else {
        resolve(stdout);
      }
    });
  });
}
