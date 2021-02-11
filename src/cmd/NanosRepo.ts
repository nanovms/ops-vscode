import * as vscode from 'vscode';

export interface Nanos {
  pid: number,
  filePath: string,
}

export default class NanosRepo {
  context: vscode.ExtensionContext;

  constructor(_context: vscode.ExtensionContext) {
    this.context = _context;
  }

  add(u: Nanos) {
    const unikernels = this._get();

    this._set([...unikernels, u]);
  }

  removeByPID(pid: number) {
    const unikernels = this._get();

    this._set(unikernels.filter(u => u.pid !== pid));
  }

  getTitles(): string[] {
    return this._get().map(u => u.pid + ":" + u.filePath);
  }

  getPIDFromTitle(uTitle: string): number  {
    return +uTitle.split(":")[0];
  }

  _get(): Nanos[] {
    let unikernels: Nanos[] | undefined = this.context.globalState.get("unikernels");

    if (!unikernels) {
      unikernels = [];
    }

    return unikernels;
  }

  _set(u: Nanos[]) {
    this.context.globalState.update("unikernels", u);
  }
}
