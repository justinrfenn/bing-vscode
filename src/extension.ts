import * as vscode from 'vscode';
import { activateChatNotebook } from './ChatNotebook';

export function activate(context: vscode.ExtensionContext) {
	activateChatNotebook(context);

	// Create command to open chat notebook
	context.subscriptions.push(vscode.commands.registerCommand('bing.createChatNotebook', async () => {
		const result: { inputUri: vscode.Uri, notebookUri?: vscode.Uri, notebookEditor?: vscode.NotebookEditor } | undefined = await vscode.commands.executeCommand('interactive.open',
		{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: false }, // new ApiCommandArgument('showOptions', 'Show Options', v => true, v => v)
			undefined, // new ApiCommandArgument('resource', 'Interactive resource Uri', v => true, v => v)
			`${context.extension.id}/bing-chat-notebook-kernel`, // new ApiCommandArgument('controllerId', 'Notebook controller Id', v => true, v => v)
			"Bing Chat" // new ApiCommandArgument('title', 'Interactive editor title', v => true, v => v)
		);
	}));

	let disposable = vscode.commands.registerCommand('bing.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Bing!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
