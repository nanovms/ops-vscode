import { ChildProcessWithoutNullStreams, execSync, SpawnOptionsWithoutStdio } from "child_process";

type Spawn = (command: string, args?: readonly string[] | undefined, options?: SpawnOptionsWithoutStdio | undefined) => ChildProcessWithoutNullStreams;

export interface BuildOptions {
  imageName: string | undefined;
  mounts: string | undefined;
}

export interface RunOptions {
  configPath: string | undefined;
  imageName: string | undefined;
  mounts: string | undefined;
}

export interface StartInstanceOptions {
  instanceName: string | undefined;
  ports: string | undefined;
  udpPorts: string | undefined;
}

export class Ops {
  spawn: Spawn;

  constructor(_spawner: Spawn) {
    this.spawn = _spawner;
  }

  build(filePath: string, options: BuildOptions): ChildProcessWithoutNullStreams {
    let args = ["build", filePath];

    if (options.imageName) {
      args = args.concat(["--imagename", options.imageName]);
    }

    if (options.mounts) {
      args = args.concat(["--mounts", options.mounts]);
    }

    return this._runOps(args);
  }

  run(filePath: string, options?: RunOptions): ChildProcessWithoutNullStreams {
    let args: string[] = [];

    if (filePath.indexOf(".js") >= 0) {
      args = ["pkg", "load", "node_v14.2.0", "-a", filePath];
    } else {
      args = ["run", filePath];
    }

    if (options) {
      if (options.imageName) {
        args = args.concat(["--imagename", options.imageName]);
      }

      if (options.mounts) {
        args = args.concat(["--mounts", options.mounts]);
      }

      if (options.configPath) {
        args = args.concat(["-c", options.configPath]);
      }
    }

    return this._runOps(args);
  }

  startInstance(name: string, options: StartInstanceOptions): ChildProcessWithoutNullStreams {
    let args: string[] = [];
    if (options.instanceName) {
      args = args.concat(["--instance-name", options.instanceName]);
    }

    if (options.ports) {
      args = args.concat(["--port", options.ports]);
    }

    if (options.udpPorts) {
      args = args.concat(["--udp", options.udpPorts]);
    }
    return this._runOps(["--show-errors", "instance", "create", name]);
  }

  stopInstance(name: string): ChildProcessWithoutNullStreams {
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
    return this.spawn("ops", args.concat(["--show-errors"]), { shell: '/bin/bash' });
  }
}
