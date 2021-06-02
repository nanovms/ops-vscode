import { ChildProcessWithoutNullStreams } from 'child_process';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import handleError from './handleError';
import logStream from './logStream';
import finishCmd from './finishCmd';

type CommandHandler = (out: vscode.OutputChannel) => Promise<ChildProcessWithoutNullStreams>;

export default function registCmd(cmd: CommandHandler, out: vscode.OutputChannel) {
	return async () => {
		try {
			if (!isOpsInstalled()) {
				vscode.window.showErrorMessage(`NanoVMs OPS is not installed. Execute the command "curl https://ops.city/get.sh -sSfL | sh" to install.`);
				return;
			}

			const stream = await cmd(out);
			await logStream(stream, out);
		} catch (e) {
			handleError(e);
			return;
		}

		finishCmd();
	};
}

function isOpsInstalled(): boolean {
	if (!process.env.PATH) {
		return false;
	}

	let pathList = process.env.PATH.split(path.delimiter);
	for(let i = pathList.length - 1; i >= 0; i--) {
		if(fs.existsSync(path.join(pathList[i], "ops"))) {
			return true;
		}
	}
	return false;
}
