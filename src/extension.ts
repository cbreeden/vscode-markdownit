/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let previewUri = vscode.Uri.parse('markdownit-preview://authority/Preview');
    let extensionPath = context.extensionPath;

    let header =  '<link rel="stylesheet" href="' + extensionPath + '/katex.min.css">';

    var md = require('markdown-it')(),
        mk = require('markdown-it-katex');

    md.use(mk);

    class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

        public provideTextDocumentContent(uri: vscode.Uri): string {
            return this.createCssSnippet();
            //return '<a href="www.google.com">google</a>';
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }

        public update(uri: vscode.Uri) {
            this._onDidChange.fire(uri);
        }

        private createCssSnippet() {
            let editor = vscode.window.activeTextEditor;
            if (editor.document.languageId !== 'markdown') {
                return "Active editor doesn't show a CSS document - no properties to preview.";
            }
            
            let text = editor.document.getText();

            return header + md.render(text);
        }
    }

    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('markdownit-preview', provider);

    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

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