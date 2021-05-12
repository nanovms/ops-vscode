import * as vscode from 'vscode';

export default async (options?: vscode.OpenDialogOptions): Promise<string> => {
  let filePath;

  const vscodeURI = await vscode.window.showOpenDialog(options);

  if (vscodeURI?.length) {
    filePath = vscodeURI[0].path;
  }

  if (!filePath) {
    return Promise.reject("No file selected");
  }

  return filePath;
};
