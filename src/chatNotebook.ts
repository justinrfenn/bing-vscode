import * as vscode from 'vscode';
import MarkdownNotebookSerializer, { rawToNotebookCellData } from './markdownNotebookSerializer';
import { parseMarkdown } from './markdownParser';

export function activateChatNotebook(context: vscode.ExtensionContext) {
  context.subscriptions.push(new ChatNotebookKernel());

  const providerOptions = {
    transientMetadata: {
      runnable: true,
      editable: true,
      custom: true,
    },
    transientOutputs: true
  };
  context.subscriptions.push(vscode.workspace.registerNotebookSerializer(
    'bing-chat-notebook',
    new MarkdownNotebookSerializer(),
    providerOptions));
}

export default class ChatNotebookKernel implements vscode.Disposable {
  readonly controllerId = 'bing-chat-notebook-kernel';
  readonly notebookType = 'interactive';
  readonly label = 'Bing Chat';
  readonly shouldOutputDiagnostics = false;
  // readonly supportedLanguages = ['python'];

  private readonly _controller: vscode.NotebookController;
  private _executionOrder = 0;

  constructor() {
    this._controller = vscode.notebooks.createNotebookController(
      this.controllerId,
      this.notebookType,
      this.label
    );

    // this._controller.supportedLanguages = this.supportedLanguages;
    this._controller.supportsExecutionOrder = true;
    this._controller.executeHandler = this._execute.bind(this);
  }

  dispose() {
    this._controller.dispose();
  }

  private _execute(
    cells: vscode.NotebookCell[],
    _notebook: vscode.NotebookDocument,
    _controller: vscode.NotebookController
  ): void {
    for (let cell of cells) {
      this._doExecution(cell);
    }
  }

  private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
    const execution = this._controller.createNotebookCellExecution(cell);
    execution.executionOrder = ++this._executionOrder;
    execution.start(Date.now()); // Keep track of elapsed time to execute cell.

    await this.insertCellFromMarkdown(cell.document.getText(), cell);

    if (this.shouldOutputDiagnostics) {
      execution.replaceOutput([
        new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.text('Output from cell execution')
        ])
      ]);
    }
    execution.end(true, Date.now());
  }

  private async insertCellFromMarkdown(markdown: string, executingCell: vscode.NotebookCell) {
    const notebook = executingCell.notebook;
    const notebookCellsToInsert: vscode.NotebookCellData[] = [];
    // TODO: Parse markdown into cells including code cells
    const cellRawData = parseMarkdown(markdown);
		const cells = cellRawData.map(rawToNotebookCellData);

    notebookCellsToInsert.push(...cells);

    const notebookEdit = vscode.NotebookEdit.insertCells(executingCell.index + 1, notebookCellsToInsert);
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(notebook.uri, [notebookEdit]);

    const success = await vscode.workspace.applyEdit(workspaceEdit);
    if (!success) {
      throw new Error('Failed to insert cell');
    }
  }
}