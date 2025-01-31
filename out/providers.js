"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTextProvider = exports.getChildrenProvider = exports.getProvider = exports.getSnippetProvider = exports.getFilterProvider = exports.getHoverFilterProvider = void 0;
const vscode_1 = require("vscode");
const utils = require("./utils");
const filters = require("./lava.json");
const { registerCompletionItemProvider, registerHoverProvider } = vscode_1.languages;
function isSet(val) {
    return typeof val != "undefined" && val != "";
}
const getHoverFilterProvider = registerHoverProvider("lava", {
    provideHover(document, position) {
        const rockFilters = filters.filters;
        const range = document.getWordRangeAtPosition(position); //[^\^] , /\^([B-Z0-9]{2}|A@?)/g
        const word = document.getText(range);
        if (word in rockFilters) {
            let childValue = rockFilters[word];
            let text = Array();
            let codeExample = word;
            if (isSet(childValue["arguments"])) {
                let parameterCount = 0;
                for (var i = 0; i < childValue.arguments.length; i++) {
                    let param = childValue.arguments[i];
                    if (isSet(param.name)) {
                        if (parameterCount > 0) {
                            codeExample += ",";
                        }
                        else {
                            codeExample += ":";
                        }
                        codeExample += param.name;
                        parameterCount++;
                    }
                }
            }
            text.push("```lavadoc");
            text.push(codeExample);
            text.push("```");
            text.push("---");
            if (text.length > 0)
                text.push("");
            if (isSet(childValue["description"])) {
                var txt_descr = childValue["description"] instanceof Array ? childValue["description"].join("\n ") : childValue["description"];
                text.push(txt_descr);
            }
            if (isSet(childValue["arguments"])) {
                for (var i = 0; i < childValue.arguments.length; i++) {
                    let param = childValue.arguments[i];
                    text.push(" ");
                    text.push("_@param_ `" + param.name + "` — " + param.description);
                }
            }
            if (text.length > 0)
                text.push("");
            if (isSet(childValue["link"])) {
                text.push("[Lava Documentation](" + childValue["link"] + ")");
            }
            let contents = new vscode_1.MarkdownString(text.join("  \n"));
            contents.isTrusted = true;
            return new vscode_1.Hover(contents);
        }
    }
});
exports.getHoverFilterProvider = getHoverFilterProvider;
const getFilterProvider = (documentSelector) => {
    const rockFilters = filters.filters;
    return registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(document, position) {
            let currentLine = document.lineAt(position).text;
            let linePrefix = currentLine.substring(0, position.character);
            let lineSuffix = currentLine.substring(position.character);
            if (!utils.isLavaFilterable.test(linePrefix) && (!utils.isInsideBrackets(currentLine, position.character) || !utils.isInsideObject(currentLine, position.character))) {
                return;
            }
            let completionItems = [];
            for (let key in rockFilters) {
                let childValue = rockFilters[key];
                let completionItem = new vscode_1.CompletionItem(key);
                let text = Array();
                completionItem.commitCharacters = ["|"];
                completionItem.label = { label: key, description: "Lava Filter" };
                if (isSet(childValue["type"])) {
                    completionItem.label = { label: key, description: childValue["type"] + " Lava Filter" };
                }
                completionItem.detail = key; // Displayed On Flyout
                //if (text.length > 0) text.push("");
                if (isSet(childValue["example"])) {
                    text.push("```lava");
                    text.push(childValue["example"]);
                    text.push("```");
                    //text.push("---");
                }
                if (text.length > 0)
                    text.push("");
                if (isSet(childValue["description"])) {
                    var txt_descr = childValue["description"] instanceof Array ? childValue["description"].join("\n ") : childValue["description"];
                    text.push(txt_descr);
                }
                if (text.length > 0)
                    text.push("");
                if (isSet(childValue["link"])) {
                    text.push("[Lava Documentation](" + childValue["link"] + ")");
                }
                completionItem.kind = vscode_1.CompletionItemKind.Function;
                const contents = new vscode_1.MarkdownString(text.join("  \n"));
                completionItem.documentation = contents;
                if (childValue["snippet"] !== undefined && childValue["snippet"] !== "") {
                    let snippet = childValue["snippet"];
                    if (!utils.lineHasPipe.test(linePrefix)) {
                        snippet = "| " + childValue["snippet"];
                    }
                    else if (!linePrefix.endsWith(' ')) {
                        snippet = " " + childValue["snippet"];
                    }
                    if (!lineSuffix.startsWith(' ')) {
                        snippet += " ";
                    }
                    completionItem.insertText = new vscode_1.SnippetString(snippet);
                    if (isSet(childValue["sortPriority"])) {
                        //console.log("priority");
                        //console.log(childValue["sortPriority"].toString().padStart(8, 'A') + childValue["snippet"])
                        completionItem.sortText = "aaaaaa" + key;
                        //   completionItem.sortText = childValue["sortPriority"].toString().padStart(8, '0') + key;
                        // } else {
                        //   completionItem.sortText =  childValue["sortPriority"].toString().padStart(8, 'Z') + key;
                    }
                }
                completionItems.push(completionItem);
            }
            return [...completionItems];
        },
    });
};
exports.getFilterProvider = getFilterProvider;
const getSnippetProvider = (documentSelector) => {
    const rockSnippets = filters.snippets;
    return registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(document, position) {
            let currentLine = document.lineAt(position).text;
            if (utils.isInsideBrackets(currentLine, position.character) || utils.isInsideObject(currentLine, position.character)) {
                //if (utils.isInsideBrackets(currentLine, position.character) ) {
                return undefined;
            }
            let completionItems = [];
            for (let key in filters.snippets) {
                let childValue = rockSnippets[key];
                let completionItem = new vscode_1.CompletionItem(key);
                let text = Array();
                completionItem.label = { label: key, description: childValue["description"] };
                if (isSet(childValue["type"])) {
                    completionItem.label = { label: key, description: childValue["type"] + " Snippet" };
                }
                completionItem.detail = childValue["description"] + " (Lava)"; // Displayed On Flyout
                if (text.length > 0)
                    text.push("");
                if (isSet(childValue["example"])) {
                    text.push("```lava");
                    text.push(childValue["example"]);
                    text.push("```");
                }
                completionItem.kind = vscode_1.CompletionItemKind.Function;
                const contents = new vscode_1.MarkdownString(text.join("  \n"));
                completionItem.documentation = contents;
                if (childValue["snippet"] !== undefined && childValue["snippet"] !== "") {
                    if (Array.isArray(childValue["snippet"])) {
                        childValue["snippet"] = childValue["snippet"].join('\n');
                    }
                    completionItem.insertText = new vscode_1.SnippetString(childValue["snippet"]);
                    // if (utils.isInsideLavaTag(document, position)) {
                    //   let snippet = childValue["snippet"].replace(/{%\s*/g, '').replace(/\s*%}/g, '').replace(/{{\s*/g, 'echo ').replace(/\s*}}/g, '');
                    //   completionItem.insertText = new SnippetString(snippet)
                    // } else {
                    //   completionItem.insertText = new SnippetString(childValue["snippet"])
                    // }
                    if (isSet(childValue["sortPriority"])) {
                        //console.log("priority");
                        //console.log(childValue["sortPriority"].toString().padStart(8, 'A') + childValue["snippet"])
                        completionItem.sortText = "aaaaaa" + key;
                        //   completionItem.sortText = childValue["sortPriority"].toString().padStart(8, '0') + key;
                        // } else {
                        //   completionItem.sortText =  childValue["sortPriority"].toString().padStart(8, 'Z') + key;
                    }
                }
                completionItems.push(completionItem);
            }
            return [...completionItems];
        },
    });
};
exports.getSnippetProvider = getSnippetProvider;
const getProvider = (sourceFile, documentSelector) => {
    return registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(document, position) {
            let completionItems = [];
            for (let key in sourceFile) {
                let childValue = sourceFile[key];
                let completionItem = new vscode_1.CompletionItem(key);
                completionItem.commitCharacters = ["."];
                completionItem.kind = vscode_1.CompletionItemKind.Class;
                completionItem.label = { label: key, description: childValue["__Description"] };
                completionItems.push(completionItem);
            }
            return [...completionItems];
        },
    });
};
exports.getProvider = getProvider;
const getChildrenProvider = (sourceFile, documentSelector) => {
    return registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(document, position) {
            const currentLine = document.lineAt(position).text;
            // if (true ||  !utils.isInsideBrackets(currentLine, position.character)) {
            //   return undefined;
            // }
            let isNodeFound = false;
            let completionItems = [];
            let linePrefix = currentLine.substring(0, position.character);
            const searchNode = (currentNode, JSONPath) => {
                if (isNodeFound) {
                    return;
                }
                if (linePrefix.endsWith(`${JSONPath}.`)) {
                    isNodeFound = true;
                    console.log("ends" + JSONPath);
                    if (typeof currentNode === "object") {
                        let i = 0;
                        for (let key in currentNode) {
                            if (currentNode[key]["__Alias"] !== undefined) {
                                let completionItem = new vscode_1.CompletionItem(key);
                                let childrenValue = currentNode[key];
                                if (typeof childrenValue === "object") {
                                    if (childrenValue["__Type"] && childrenValue["__Type"] === "Field") {
                                        completionItem.kind = vscode_1.CompletionItemKind.Field;
                                        completionItem.documentation = childrenValue["__Description"];
                                        completionItem.detail = childrenValue["__Detail"];
                                        completionItem.label = { label: key, description: childrenValue["__Detail"] };
                                    }
                                    else {
                                        completionItem.commitCharacters = ["."];
                                        completionItem.kind = vscode_1.CompletionItemKind.Property;
                                        completionItem.label = { label: key, description: childrenValue["__Description"] };
                                        if (childrenValue["__Description"]) {
                                            completionItem.documentation = childrenValue["__Description"];
                                        }
                                    }
                                }
                                else {
                                    completionItem.documentation = childrenValue;
                                    completionItem.kind = vscode_1.CompletionItemKind.Field;
                                }
                                completionItem.sortText = ('000' + i).slice(-4);
                                completionItems.push(completionItem);
                                i++;
                            }
                            else {
                                console.log("has alias");
                                let alias = currentNode[key];
                                console.log(currentNode[key]);
                                let i = 0;
                                for (let kd in sourceFile[alias]) {
                                    //console.log(`${alias}.${kd}`);
                                    let completionItem = new vscode_1.CompletionItem(kd);
                                    let childrenValue = sourceFile[alias][kd];
                                    if (typeof childrenValue === "object") {
                                        if (childrenValue["__Type"] && childrenValue["__Type"] === "Field") {
                                            completionItem.kind = vscode_1.CompletionItemKind.Field;
                                            completionItem.documentation = childrenValue["__Description"];
                                            completionItem.detail = childrenValue["__Detail"];
                                        }
                                        else {
                                            completionItem.commitCharacters = ["."];
                                            completionItem.kind = vscode_1.CompletionItemKind.Property;
                                            completionItem.detail = "These are some details";
                                            if (childrenValue["__Description"]) {
                                                completionItem.documentation = childrenValue["__Description"];
                                            }
                                        }
                                    }
                                    else {
                                        completionItem.documentation = childrenValue;
                                        completionItem.kind = vscode_1.CompletionItemKind.Field;
                                    }
                                    completionItem.sortText = ('000' + i).slice(-4);
                                    //console.log(completionItem);
                                    completionItems.push(completionItem);
                                    i++;
                                }
                            }
                        }
                    }
                }
                else if (typeof currentNode === "object") {
                    let str = JSON.stringify(currentNode);
                    for (let key in currentNode) {
                        if (currentNode[key]["__Alias"] !== undefined) {
                            //let magickey = `${JSONPath}.${key}`;
                            //console.log(linePrefix)
                            //console.log(magickey)
                            if (linePrefix.endsWith(`${JSONPath}.${key}.`)) {
                                isNodeFound = true;
                                let alias = currentNode[key]["__Alias"];
                                let i = 0;
                                for (let kd in sourceFile[alias]) {
                                    //console.log(`${magickey}.${kd}`);
                                    let completionItem = new vscode_1.CompletionItem(kd);
                                    let childrenValue = sourceFile[alias][kd];
                                    if (typeof childrenValue === "object") {
                                        if (childrenValue["__Type"] && childrenValue["__Type"] === "Field") {
                                            completionItem.kind = vscode_1.CompletionItemKind.Field;
                                            completionItem.documentation = childrenValue["__Description"];
                                            completionItem.detail = childrenValue["__Detail"];
                                        }
                                        else {
                                            completionItem.commitCharacters = ["."];
                                            completionItem.kind = vscode_1.CompletionItemKind.Property;
                                            completionItem.detail = "These are some details";
                                            if (childrenValue["__Description"]) {
                                                completionItem.documentation = childrenValue["__Description"];
                                            }
                                        }
                                    }
                                    else {
                                        completionItem.documentation = childrenValue;
                                        completionItem.kind = vscode_1.CompletionItemKind.Field;
                                    }
                                    completionItem.sortText = ('000' + i).slice(-4);
                                    //console.log(completionItem);
                                    completionItems.push(completionItem);
                                    i++;
                                }
                            }
                        }
                        //searchNode(currentNode[key], `${JSONPath}.${key}`);
                    }
                }
            };
            for (let key in sourceFile) {
                searchNode(sourceFile[key], key);
            }
            return isNodeFound ? completionItems : undefined;
        },
    }, ".");
};
exports.getChildrenProvider = getChildrenProvider;
const getTextProvider = (sourceFile, documentSelector) => {
    return registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(document, position) {
            const currentLine = document.lineAt(position).text;
            // if (true ||  !utils.isInsideBrackets(currentLine, position.character)) {
            //   return undefined;
            // }
            let completionItems = [];
            const searchNode = (currentNode, JSONPath) => {
                if (typeof currentNode === "object") {
                    for (let key in currentNode) {
                        searchNode(currentNode[key], `${JSONPath}.${key}`);
                    }
                }
                else {
                    // let completionItem = new CompletionItem(currentNode);
                    // completionItem.detail = `${JSONPath}: ${currentNode}`;
                    // completionItem.kind = CompletionItemKind.Field;
                    // completionItem.insertText = JSONPath;
                    // completionItems.push(completionItem);
                }
            };
            for (let key in sourceFile) {
                searchNode(sourceFile[key], key);
            }
            return [...completionItems];
        },
    });
};
exports.getTextProvider = getTextProvider;
//
//# sourceMappingURL=providers.js.map