import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { OpsDefault } from './lib/ops_default/index';
import CmdHandler from './cmd/cmdHandler';
import handleCmd from './cmd/handleCmd';
import NanosRepo from './cmd/NanosRepo';

export function activate(context: vscode.ExtensionContext) {
	let out = vscode.window.createOutputChannel("ops");

	const ops = new OpsDefault(spawn);
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

	let startInstance = vscode.commands.registerCommand("ops.startInstance", handleCmd(cmdHandler.startInstance, out));
	context.subscriptions.push(startInstance);

	let stopInstance = vscode.commands.registerCommand("ops.stopInstance", handleCmd(cmdHandler.stopInstance, out));
	context.subscriptions.push(stopInstance);
}

// this method is called when your extension is deactivated
export function deactivate() { }



