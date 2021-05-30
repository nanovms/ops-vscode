import * as vscode from 'vscode';
import * as path from 'path';
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import pickExplorerFile from "./pickExplorerFile";
import { Nanos } from "./NanosRepo";
import * as lib from "../lib/ops";

interface NanosRepo {
  add(u: Nanos): void
  removeByPID(pid: number): void
  getTitles(): string[]
  getPIDFromTitle(uTitle: string): number
}

export default class CmdHandler {
  ops: lib.Ops;
  nanosRepo: NanosRepo;

  constructor(_ops: lib.Ops, _repo: NanosRepo) {
    this.ops = _ops;
    this.nanosRepo = _repo;
  }

  build = async (): Promise<ChildProcessWithoutNullStreams> => {
    const filePath = await pickExplorerFile();
    let opts = await this._askImageNameAndMounts(filePath);
    return this.ops.build(filePath, opts);
  };

  run = async (): Promise<ChildProcessWithoutNullStreams> => {
    const filePath = await pickExplorerFile();
    let opts = await this._askImageNameAndMounts(filePath);

    const proc = this.ops.run(filePath, {
      configPath: undefined,
      imageName: opts.imageName,
      mounts: opts.mounts
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

    let opts = await this._askImageNameAndMounts(filePath);

    const proc = this.ops.run(filePath, {
      configPath: configPath,
      imageName: opts.imageName,
      mounts: opts.mounts
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
    let filePath;

    filePath = vscode.window.activeTextEditor?.document.uri.path;

    if (!filePath) {
      throw new Error("Open the file you want to execute");
    }

    let opts = await this._askImageNameAndMounts(filePath);
    const proc = this.ops.run(filePath, {
      configPath: undefined,
      imageName: opts.imageName,
      mounts: opts.mounts
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

    let proc = this.ops.startInstance(name);
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

  _askImageNameAndMounts = async (filepath: string): Promise<lib.BuildOptions> => {
    let fileName = path.basename(filepath);
    fileName = fileName.replace(path.extname(fileName), "");
    let imageName = await vscode.window.showInputBox({
      title: "Image Name",
      value: fileName
    });

    let mounts = await vscode.window.showInputBox({
      title: "Mounts"
    });

    return {
      imageName: imageName,
      mounts: mounts?.trim().length ? mounts : undefined
    };
  };
}
