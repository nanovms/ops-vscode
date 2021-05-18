import { ChildProcessWithoutNullStreams, execSync, SpawnOptionsWithoutStdio } from "child_process";

type Spawn = (command: string, args?: readonly string[] | undefined, options?: SpawnOptionsWithoutStdio | undefined) => ChildProcessWithoutNullStreams;

export default class Ops {
  spawn: Spawn;

  constructor(_spawner: Spawn) {
    this.spawn = _spawner;
  }

  build(filePath: string, configPath: string): ChildProcessWithoutNullStreams {
    let args = ["build", filePath];

    if (configPath) {
      args = args.concat(["-c", configPath])
    }

    return this._runOps(args);
  }

  run(filePath: string, configPath: string): ChildProcessWithoutNullStreams {
    let args: string[] = [];

    if (filePath.indexOf(".js") >= 0) {
      args = ["pkg", "load", "node_v14.2.0", "-a", filePath];
    } else {
      args = ["run", filePath];
    }

    if (configPath) {
      args = args.concat(["-c", configPath])
    }

    return this._runOps(args);
  }

  runImage(name: string): ChildProcessWithoutNullStreams {
    return this._runOps(["--show-errors", "instance", "create", name]);
  }

  stopImage(name: string): ChildProcessWithoutNullStreams {
    return this._runOps(["--show-errors", "instance", "delete", name]);
  }

  listInstances(): string[] {
    let cmdOut = execSync("ops instance list");
    return this._extractColumnFromCmdOut(cmdOut.toString(), 2);
  }

  listImages(): string[] {
    let cmdOut = execSync("ops image list");
    return this._extractColumnFromCmdOut(cmdOut.toString(), 1);
  }

  _extractColumnFromCmdOut(cmdOut: string, colIndex: number): string[] {
    let rows: string[] = [];
    let lines = cmdOut.toString().split('\n');
    if (lines.length === 3) {
      return rows; // no image listed
    }

    let columns: string[];
    let value: string;
    let line: string;
    for (let i = 3; i < lines.length; i++) {
      line = lines[i].trim();
      if (line.startsWith('+') || line.startsWith('-')) {
        continue;
      }

      if (line.length === 0) {
        continue;
      }

      columns = lines[i].split('|');
      value = columns[colIndex].trim();
      rows.push(value);
    }
    return rows;
  }

  _runOps(args: string[]): ChildProcessWithoutNullStreams {
    return this.spawn("ops", args, { shell: '/bin/bash' });
  }
}
