import * as vscode from 'vscode';

export default async (): Promise<string> => {
  let filePath;

  const vscodeURI = await vscode.window.showOpenDialog();

  if (vscodeURI?.length) {
    filePath = vscodeURI[0].path;
  }

  if (!filePath) {
    return Promise.reject("No file selected");
  }

  return filePath;
};
