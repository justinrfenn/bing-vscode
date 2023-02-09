
import * as vscode from 'vscode';
import { parseMarkdown, writeCellsToMarkdown, RawNotebookCell } from './markdownParser';

// there are globals in workers and nodejs
declare class TextDecoder {
	decode(data: Uint8Array): string;
}
declare class TextEncoder {
	encode(data: string): Uint8Array;
}

export default class MarkdownNotebookSerializer implements vscode.NotebookSerializer {

	private readonly decoder = new TextDecoder();
	private readonly encoder = new TextEncoder();

	deserializeNotebook(data: Uint8Array, _token: vscode.CancellationToken): vscode.NotebookData | Thenable<vscode.NotebookData> {
		const content = this.decoder.decode(data);

		const cellRawData = parseMarkdown(content);
		const cells = cellRawData.map(rawToNotebookCellData);

		return {
			cells
		};
	}

	serializeNotebook(data: vscode.NotebookData, _token: vscode.CancellationToken): Uint8Array | Thenable<Uint8Array> {
		const stringOutput = writeCellsToMarkdown(data.cells);
		return this.encoder.encode(stringOutput);
	}
}

export function rawToNotebookCellData(data: RawNotebookCell): vscode.NotebookCellData {
	return <vscode.NotebookCellData>{
		kind: data.kind,
		languageId: data.language,
		metadata: { leadingWhitespace: data.leadingWhitespace, trailingWhitespace: data.trailingWhitespace, indentation: data.indentation },
		outputs: [],
		value: data.content
	};
}