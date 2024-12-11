// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface Node {
    name: string
	link: vscode.Uri
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-tree" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('code-tree.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from code-tree!');
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'catCoding.start',
			async () => {
				const activeEditor = vscode.window.activeTextEditor
				if (!activeEditor) {
					return
				}
				const selection = activeEditor.selection.active

				// Create and show a new webview
				const panel = vscode.window.createWebviewPanel(
					'catCoding', // Identifies the type of the webview. Used internally
					'Call graph maybe ?', // Title of the panel displayed to the user
					vscode.ViewColumn.One, // Editor column to show the new webview panel in.
					{
						enableScripts: true,
						retainContextWhenHidden: true,
						enableCommandUris: true,
					},
				)

				const callHierarchyItems: vscode.CallHierarchyItem[] = await vscode.commands.executeCommand(
					'vscode.prepareCallHierarchy',
					activeEditor.document.uri,
					new vscode.Position(selection.line, selection.character),
				)
			
				if (callHierarchyItems.length === 0) {
					return
				}
			
				const incomingCalls: vscode.CallHierarchyIncomingCall[] = await vscode.commands.executeCommand('vscode.provideIncomingCalls', callHierarchyItems[0])
			
				const outgoingCalls: vscode.CallHierarchyOutgoingCall[] = await vscode.commands.executeCommand('vscode.provideOutgoingCalls', callHierarchyItems[0])

				const outgoingNodes = outgoingCalls.map(outgoingCall => {
					const nodeName = outgoingCall.to.name
					const location = new vscode.Location(outgoingCall.to.uri, outgoingCall.to.range)
					const gotoFileCommandUri = vscode.Uri.parse(`command:vscode.open?${encodeURIComponent(JSON.stringify(outgoingCall.to.uri))}`)
					// const gotoFileCommandUri = vscode.Uri.parse(`
					// 	command:editor.action.goToLocations
					// 	?${encodeURIComponent(JSON.stringify(outgoingCall.to.uri))}
					// `)
					const node: Node = {
						name: nodeName,
						link: gotoFileCommandUri,
					}
					return node
				})				

				// And set its HTML content
				panel.webview.html = getWebviewContent(
					callHierarchyItems[0].name,
					outgoingNodes,
				)
			}
		)
	)
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(
	currentNodeName: string,
	// outgoingCallsNodesNames: string[],
	// link: vscode.Uri,
	outgoingNodes: Array<Node>

) {
	return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Cat Coding</title>
			</head>
			<body>
				<div>
					Current node
					${currentNodeName}
				</div>
				<div>
					Outgoing calls

					${outgoingNodes.map(node => `
						<div>
							<a href=${node.link}>${node.name}</a>
						</div>
					`)}
				</div>
			</body>
		</html>
	`
}
