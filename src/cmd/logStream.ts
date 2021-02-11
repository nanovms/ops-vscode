import * as vscode from 'vscode';
import { ChildProcessWithoutNullStreams } from 'child_process';

export default (stream: ChildProcessWithoutNullStreams, out: vscode.OutputChannel) => {
  // out.clear();
  out.show();

  return new Promise((accept, reject) => {
    stream.stdout.on("data", data => {
      out.append(`${data}`);
    });

    stream.stderr.on("data", data => {
      out.append(`stderr: ${data}`);
    });

    stream.on('error', (error) => {
      out.append(`error: ${error.message}`);
      reject(error);
    });

    stream.on("close", code => {
      if (!code) {
        return accept(code);
      } else {
        out.append(`child process exited with code ${code}`);
      }
    });
  });
};
