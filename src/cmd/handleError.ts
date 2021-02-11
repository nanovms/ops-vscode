import * as vscode from 'vscode';

export default (message: string) => {
  vscode.window.showErrorMessage("Ops Error: "+ message);
};
