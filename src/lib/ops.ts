import { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from "child_process";

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

  _runOps(args: string[]): ChildProcessWithoutNullStreams {
    return this.spawn("ops", args, { shell: '/bin/bash' });
  }
}
