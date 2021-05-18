import * as vscode from 'vscode';
import { spawn } from 'child_process';

import Ops from './lib/ops';
import CmdHandler from './cmd/cmdHandler';
import handleCmd from './cmd/handleCmd';
import NanosRepo from './cmd/NanosRepo';



export function activate(context: vscode.ExtensionContext) {

	let out = vscode.window.createOutputChannel("ops");

	const ops = new Ops(spawn);
	const repo = new NanosRepo(context);
	const cmdHandler = new CmdHandler(ops, repo);

	let runCmd = vscode.commands.registerCommand("ops.run", handleCmd(cmdHandler.run, out));
	context.subscriptions.push(runCmd);

	let runOpenCmd = vscode.commands.registerCommand('ops.runOpen', handleCmd(cmdHandler.runOpen, out));
	context.subscriptions.push(runOpenCmd);

	let runWithConfigCmd = vscode.commands.registerCommand('ops.runWithConfig', handleCmd(cmdHandler.runWithConfig, out));
	context.subscriptions.push(runWithConfigCmd);

	let runBuild = vscode.commands.registerCommand('ops.build', handleCmd(cmdHandler.build, out));
	context.subscriptions.push(runBuild);

	let stopCmd = vscode.commands.registerCommand('ops.stop', handleCmd(cmdHandler.stop, out));
	context.subscriptions.push(stopCmd);

	let runImage = vscode.commands.registerCommand("ops.runImage", handleCmd(cmdHandler.runImage, out));
	context.subscriptions.push(runImage);

	let stopImage = vscode.commands.registerCommand("ops.stopImage", handleCmd(cmdHandler.stopImage, out));
	context.subscriptions.push(stopImage);
}

// this method is called when your extension is deactivated
export function deactivate() { }



