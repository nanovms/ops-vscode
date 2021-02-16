import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from "child_process";

type Spawn = (command: string, args?: readonly string[] | undefined, options?: SpawnOptionsWithoutStdio | undefined) => ChildProcessWithoutNullStreams;

export default class Ops {
  spawn: Spawn;

  constructor(_spawner: Spawn) {
    this.spawn = _spawner;
  }

  build(filePath: string): ChildProcessWithoutNullStreams {
    return this._runOps(["build", filePath]);
  }

  run(filePath: string): ChildProcessWithoutNullStreams {
    let args: string[] = [];

    if (filePath.indexOf(".js") >= 0) {
      args = ["pkg", "load", "node_v14.2.0", "-a", filePath];
    } else {
      args = ["run", filePath];
    }

    return this._runOps(args);
  }

  _runOps(args: string[]): ChildProcessWithoutNullStreams {
    return this.spawn("ops", args, { shell: '/bin/bash' });
  }
}
