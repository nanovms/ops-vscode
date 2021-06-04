import * as vscode from 'vscode';
import * as path from 'path';
import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import pickExplorerFile from './pickExplorerFile';
import { Nanos } from './NanosRepo';
import { Ops, BuildOptions } from '../lib/ops/index';

interface NanosRepo {
  add(u: Nanos): void
  removeByPID(pid: number): void
  getTitles(): string[]
  getPIDFromTitle(uTitle: string): number
}

export default class CmdHandler {
  ops: Ops;
  nanosRepo: NanosRepo;

  constructor(_ops: Ops, _repo: NanosRepo) {
    this.ops = _ops;
    this.nanosRepo = _repo;
  }

  build = async (): Promise<ChildProcessWithoutNullStreams> => {
    const filePath = await pickExplorerFile();
    return this.ops.build(filePath, {
      imageName: await this._askImageName(filePath),
      mounts: await this._askMounts()
    });
  };

  run = async (): Promise<ChildProcessWithoutNullStreams> => {
    const filePath = await pickExplorerFile();
    const proc = this.ops.run(filePath, {
      imageName: await this._askImageName(filePath),
      mounts: await this._askMounts()
    });

    this.nanosRepo.add({
      pid: proc.pid,
      filePath: filePath,
    });

    proc.on("close", () => {
      this.nanosRepo.removeByPID(proc.pid);
    });

    return proc;
  };

  runWithConfig = async (): Promise<ChildProcessWithoutNullStreams> => {
    const filePath = await pickExplorerFile({
      title: "Select a ELF or javascript file"
    });
    const configPath = await pickExplorerFile({
      title: "Select the configuration file",
      filters: {
        "JSON": ["json"]
      }
    });

    const proc = this.ops.run(filePath, {
      configPath: configPath,
      imageName: await this._askImageName(filePath),
      mounts: await this._askMounts()
    });

    this.nanosRepo.add({
      pid: proc.pid,
      filePath: filePath,
    });

    proc.on("close", () => {
      this.nanosRepo.removeByPID(proc.pid);
    });

    return proc;
  };

  runOpen = async (): Promise<ChildProcessWithoutNullStreams> => {
    let filePath = vscode.window.activeTextEditor?.document.uri.path;
    if (!filePath) {
      throw new Error("Open the file you want to execute");
    }

    const proc = this.ops.run(filePath, {
      imageName: await this._askImageName(filePath),
      mounts: await this._askMounts()
    });

    this.nanosRepo.add({
      pid: proc.pid,
      filePath: filePath,
    });

    proc.on("close", () => {
      this.nanosRepo.removeByPID(proc.pid);
    });

    return proc;
  };

  stop = async (): Promise<ChildProcessWithoutNullStreams> => {
    const nanosTitles = this.nanosRepo.getTitles();

    if (!nanosTitles.length) {
      throw new Error("No nanos to stop");
    }

    const result = await vscode.window.showQuickPick(nanosTitles, {
      placeHolder: 'Select nanos to stop',
    });

    if (!result) {
      throw new Error("No nanos selected");
    }

    const pid = this.nanosRepo.getPIDFromTitle(result);

    // kill extension execution child processes, namely qemu instance
    await exec(`kill $(ps -o pid= --ppid ${pid})`);

    return spawn("kill", ["-9", "" + pid]);
  };

  startInstance = async (out: vscode.OutputChannel): Promise<ChildProcessWithoutNullStreams> => {
    let names = this.ops.listImages();
    if (names.length === 0) {
      return Promise.reject("Cannot find created images");
    }

    let name = await vscode.window.showQuickPick(names, { placeHolder: 'Select image to run' });
    if (!name) {
      return Promise.reject("No image selected");
    }

    let instanceName = await vscode.window.showInputBox({
      placeHolder: "Instance name to use"
    });
    let ports = await vscode.window.showInputBox({
      placeHolder: "Comma-separated TCP ports to open"
    });

    let udpPorts = await vscode.window.showInputBox({
      placeHolder: "Comma-separated UDP ports to open"
    });

    let proc = this.ops.startInstance(name, {
      instanceName: instanceName,
      ports: this._sanitizeArrayInput(ports),
      udpPorts: this._sanitizeArrayInput(udpPorts)
    });
    proc.on("error", function (err) {
      out.appendLine(`Failed to run image '${name}': ${err.message}`);
    });
    return proc;
  };

  stopInstance = async (out: vscode.OutputChannel): Promise<ChildProcessWithoutNullStreams> => {
    let names = this.ops.listInstances();
    if (names.length === 0) {
      return Promise.reject("Cannot find running instances");
    }

    let name = await vscode.window.showQuickPick(names, { placeHolder: 'Select instance to stop' });
    if (!name) {
      return Promise.reject("No instance selected");
    }

    let proc = this.ops.stopInstance(name);
    proc.on("error", function (err) {
      out.appendLine(`Failed to stop instance '${name}': ${err.message}`);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        out.appendLine(`Instance '${name}' stopped`);
      }
    });

    return proc;
  };

  _askImageName = async (filepath: string): Promise<string | undefined> => {
    let fileName = path.basename(filepath);
    fileName = fileName.replace(path.extname(fileName), "");
    return vscode.window.showInputBox({
      value: fileName,
      placeHolder: "Image name to use"
    });
  };

  _askMounts = async (): Promise<string | undefined> => {
    let volumeIDs = this.ops.listVolumeID();
    let ids = await vscode.window.showQuickPick(volumeIDs, {
      placeHolder: "Select volumes to mount",
      canPickMany: true
    });

    let mounts: string[] = [];
    if (ids?.length) {
      let mountPath: string | undefined;
      for (let i = 0; i < ids.length; i++) {
        mountPath = await vscode.window.showInputBox({
          prompt: `Mount point for volume ${ids[i]}`,
          placeHolder: "Path to mount the volume"
        });
        if (mountPath) {
          mounts.push(`${ids[i]}:${mountPath}`);
        }
      }
    }
    console.log(mounts.join());
    return mounts.join();
  };

  _sanitizeArrayInput = (s: string | undefined): string | undefined => {
    if (!s) {
      return s;
    }

    let str = s.trim();
    if (str.length === 0) {
      return undefined;
    }

    if (str.endsWith(",")) {
      str = str.substring(0, str.length - 1);
    }
    return str;
  };
}
