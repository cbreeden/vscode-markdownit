'use strict';

// TODO: Only import what is needed from 'vscode'
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    // TODO: Change URI to display filename-Preview
    let previewUri = vscode.Uri.parse('markdownit-preview://cbreeden/preview');
    let extensionPath = context.extensionPath;

    // TODO: Create a template to use for creating the html document
    let header =  '<link rel="stylesheet" href="' + extensionPath + '/katex.min.css">';

    class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
        _waiting : boolean = false;
        _md = require('markdown-it')();
        _mk = require('markdown-it-katex');

        constructor() {
            // Register KaTeX plugin for markdown-it
            // TODO: Figure out a way to allow people to laod more plugins
            // TODO: Send required parameters to KaTeX, like ThrowOnError: False
            this._md.us(this._mk);
        }

        public provideTextDocumentContent(uri: vscode.Uri): string {
            let editor = vscode.window.activeTextEditor;
            if (editor.document.languageId !== 'markdown') {
                return "Active editor doesn't show a CSS document - no properties to preview.";
            }
            
            let text = editor.document.getText();
            return header + md.render(text);
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }
    
        // API to indicate document has been updated (from given Uri)
        public update(uri: vscode.Uri) {
            // Set timeout to prevent spamming markdown-it
            if (!this._waiting) {
                this._waiting = true;
                setTimeout(() => {
                    this._waiting = false;
                    this._onDidChange.fire(uri);
                }, 300);
            }
        }
    }

    // Register the content provided, associating it to a the scheme `markdownit-preview`
    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('markdownit-preview', provider);

    // Register event notifications for when markdown document changes
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    // Register the `Markdown-it: Preview` command
    let disposable = vscode.commands.registerCommand('extension.markdownitPreview', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two).then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });

    context.subscriptions.push(disposable, registration);
}

export function deactivate() {
}