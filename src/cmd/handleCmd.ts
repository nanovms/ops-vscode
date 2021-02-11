import { ChildProcessWithoutNullStreams } from 'child_process';
import * as vscode from 'vscode';

import { Nanos } from './NanosRepo';
import handleError from './handleError';
import logStream from './logStream';
import finishCmd from './finishCmd';

type CommandHandler = () => Promise<ChildProcessWithoutNullStreams>;

export default function registCmd(cmd: CommandHandler, out: vscode.OutputChannel) {
	return async () => {
		try {
			const stream = await cmd();
			await logStream(stream, out);
		} catch (e) {
			handleError(e);
			return;
		}

		finishCmd();
	};
}
