export class LuaValidator {
    constructor() {
        this.keywords = new Set([
            'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
            'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
            'repeat', 'return', 'then', 'true', 'until', 'while',
            // Luau specific
            'type', 'export', 'continue', 'typeof'
        ]);

        this.builtins = new Set([
            'assert', 'collectgarbage', 'dofile', 'error', 'getfenv', 'getmetatable',
            'ipairs', 'load', 'loadfile', 'loadstring', 'module', 'next', 'pairs',
            'pcall', 'print', 'rawequal', 'rawget', 'rawlen', 'rawset', 'require',
            'select', 'setfenv', 'setmetatable', 'tonumber', 'tostring', 'type',
            'unpack', 'xpcall', '_G', '_VERSION', 'warn', 'typeof', 'newproxy'
        ]);

        this.commonMisspellings = {
            'funciton': 'function',
            'fucntion': 'function',
            'funtion': 'function',
            'functoin': 'function',
            'retrun': 'return',
            'retrn': 'return',
            'reutrn': 'return',
            'esle': 'else',
            'elsif': 'elseif',
            'elsefi': 'elseif',
            'whiel': 'while',
            'wihle': 'while',
            'repat': 'repeat',
            'repet': 'repeat',
            'untill': 'until',
            'untl': 'until',
            'locl': 'local',
            'loal': 'local',
            'lacal': 'local',
            'pirnt': 'print',
            'prnit': 'print',
            'prnt': 'print',
            'lenght': 'length',
            'lengh': 'length',
            'tabel': 'table',
            'tbale': 'table',
            'stirng': 'string',
            'srting': 'string',
            'strig': 'string',
            'numbr': 'number',
            'numer': 'number',
            'boolen': 'boolean',
            'bolean': 'boolean'
        };
    }

    validate(code) {
        const errors = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('--') && !trimmedLine.startsWith('--[[')) continue;

            if (this.isInMultilineComment(lines, i)) continue;

            this.checkStringLiterals(line, lineNumber, errors);
            this.checkFunctionSyntax(line, lineNumber, errors);
            this.checkKeywordUsage(line, lineNumber, errors);
            this.checkVariableDeclaration(line, lineNumber, errors);
            this.checkOperatorUsage(line, lineNumber, errors);
            this.checkCommonMistakes(line, lineNumber, errors);
        }

        this.checkBlockStructure(code, errors);

        return errors;
    }

    isInMultilineComment(lines, currentLineIndex) {
        let inComment = false;
        let commentLevel = 0;
        
        for (let i = 0; i <= currentLineIndex; i++) {
            const line = lines[i];
            
            const commentStartMatches = [...line.matchAll(/--\[=*\[/g)];
            const commentEndMatches = [...line.matchAll(/\]=*\]/g)];
            
            for (const match of commentStartMatches) {
                const equalSigns = match[0].match(/=/g)?.length || 0;
                if (!inComment) {
                    inComment = true;
                    commentLevel = equalSigns;
                }
            }
            
            for (const match of commentEndMatches) {
                const equalSigns = match[0].match(/=/g)?.length || 0;
                if (inComment && equalSigns === commentLevel) {
                    inComment = false;
                    commentLevel = 0;
                }
            }
            
            // Handle simple multiline comments --[[ ]]
            if (!inComment) {
                const simpleStart = line.indexOf('--[[');
                const simpleEnd = line.indexOf(']]');
                
                if (simpleStart !== -1 && simpleEnd !== -1 && simpleStart < simpleEnd) {
                    continue;
                } else if (simpleStart !== -1) {
                    inComment = true;
                    commentLevel = 0;
                } else if (simpleEnd !== -1 && inComment && commentLevel === 0) {
                    inComment = false;
                }
            }
        }
        
        return inComment;
    }

    checkStringLiterals(line, lineNumber, errors) {
        let inString = false;
        let stringChar = '';
        let escaped = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\' && inString) {
                escaped = true;
                continue;
            }

            if ((char === '"' || char === "'") && !inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar && inString) {
                inString = false;
                stringChar = '';
            }
        }

        if (inString) {
            errors.push({
                line: lineNumber,
                column: line.lastIndexOf(stringChar) + 1,
                message: `Unterminated string literal`,
                severity: 'error',
                type: 'syntax'
            });
        }
    }

    checkFunctionSyntax(line, lineNumber, errors) {
        const functionMatch = line.match(/\b(?:local\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (functionMatch) {
            const funcName = functionMatch[1];
            if (this.keywords.has(funcName) && funcName !== 'function') {
                errors.push({
                    line: lineNumber,
                    column: line.indexOf(funcName) + 1,
                    message: `Cannot use keyword '${funcName}' as function name`,
                    severity: 'error',
                    type: 'semantic'
                });
            }
        }

        const invalidFunctionMatch = line.match(/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[^(]/);
        if (invalidFunctionMatch && !line.includes('(')) {
            errors.push({
                line: lineNumber,
                column: line.indexOf('function') + 1,
                message: `Function declaration missing parentheses`,
                severity: 'error',
                type: 'syntax'
            });
        }
    }

    checkKeywordUsage(line, lineNumber, errors) {
        // checks for misspelled keywords
        Object.keys(this.commonMisspellings).forEach(misspelling => {
            const regex = new RegExp(`\\b${misspelling}\\b`, 'gi');
            let match;
            while ((match = regex.exec(line)) !== null) {
                errors.push({
                    line: lineNumber,
                    column: match.index + 1,
                    message: `Did you mean '${this.commonMisspellings[misspelling]}'? Found '${misspelling}'`,
                    severity: 'warning',
                    type: 'spelling',
                    suggestion: this.commonMisspellings[misspelling]
                });
            }
        });

        if (line.includes('else if') && !line.includes('elseif')) {
            const pos = line.indexOf('else if');
            errors.push({
                line: lineNumber,
                column: pos + 1,
                message: `Use 'elseif' instead of 'else if' in Lua`,
                severity: 'warning',
                type: 'style'
            });
        }
    }

    checkVariableDeclaration(line, lineNumber, errors) {
        const varMatch = line.match(/\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
        if (varMatch) {
            varMatch.forEach(match => {
                const varName = match.replace('local', '').trim();
                if (this.keywords.has(varName) && !line.includes('local function')) {
                    errors.push({
                        line: lineNumber,
                        column: line.indexOf(varName) + 1,
                        message: `Cannot use keyword '${varName}' as variable name`,
                        severity: 'error',
                        type: 'semantic'
                    });
                }
            });
        }

        const assignMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
        if (assignMatch && !line.includes('==') && !line.includes('~=') && !line.includes('<=') && !line.includes('>=') && !line.includes('function')) {
            const varName = assignMatch[1];
            if (this.keywords.has(varName)) {
                errors.push({
                    line: lineNumber,
                    column: line.indexOf(varName) + 1,
                    message: `Cannot assign to keyword '${varName}'`,
                    severity: 'error',
                    type: 'semantic'
                });
            }
        }
    }

    checkOperatorUsage(line, lineNumber, errors) {
        // checks for invalid operator combinations
        const invalidOps = ['===', '!==', '!=', '++', '--', '&&', '||'];
        invalidOps.forEach(op => {
            if (line.includes(op)) {
                const pos = line.indexOf(op);
                let suggestion = '';
                switch (op) {
                    case '===':
                    case '!==':
                    case '!=':
                        suggestion = op.includes('!') ? '~=' : '==';
                        break;
                    case '++':
                    case '--':
                        suggestion = 'variable = variable + 1';
                        break;
                    case '&&':
                        suggestion = 'and';
                        break;
                    case '||':
                        suggestion = 'or';
                        break;
                }
                errors.push({
                    line: lineNumber,
                    column: pos + 1,
                    message: `Invalid operator '${op}'. Use '${suggestion}' instead`,
                    severity: 'error',
                    type: 'syntax'
                });
            }
        });

        const singleEqualMatch = line.match(/\bif\s+.*[^=!<>~]=(?!=)/);
        if (singleEqualMatch) {
            errors.push({
                line: lineNumber,
                column: line.indexOf('=') + 1,
                message: `Use '==' for comparison, not '=' (assignment)`,
                severity: 'warning',
                type: 'logic'
            });
        }
    }

    checkCommonMistakes(line, lineNumber, errors) {
        const methodCallMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (methodCallMatch) {
            const commonMethods = ['insert', 'remove', 'sort', 'concat', 'find', 'sub', 'gsub', 'match'];
            if (commonMethods.includes(methodCallMatch[2])) {
                errors.push({
                    line: lineNumber,
                    column: line.indexOf('.') + 1,
                    message: `Consider using ':' instead of '.' for method call '${methodCallMatch[2]}'`,
                    severity: 'info',
                    type: 'style'
                });
            }
        }

        const ifWithoutThen = line.match(/\bif\s+.+\s+do\b/);
        if (ifWithoutThen) {
            errors.push({
                line: lineNumber,
                column: line.indexOf('do') + 1,
                message: `Use 'then' instead of 'do' in if statements`,
                severity: 'error',
                type: 'syntax'
            });
        }

        if (line.includes('.length')) {
            const pos = line.indexOf('.length');
            errors.push({
                line: lineNumber,
                column: pos + 1,
                message: `Use '#' operator instead of '.length' to get table/string length`,
                severity: 'warning',
                type: 'style'
            });
        }
    }

    checkBlockStructure(code, errors) {
        const blockKeywords = ['function', 'if', 'for', 'while', 'repeat', 'do'];
        const endKeywords = ['end', 'until'];
        const stack = [];
        const lines = code.split('\n');

        let inString = false;
        let stringChar = '';
        let inComment = false;
        let commentLevel = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const nextChar = j < line.length - 1 ? line[j + 1] : '';
                const prevChar = j > 0 ? line[j - 1] : '';

                if (!inComment && (char === '"' || char === "'") && prevChar !== '\\') {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar) {
                        inString = false;
                        stringChar = '';
                    }
                    continue;
                }

                if (inString) continue;

                if (char === '-' && nextChar === '-' && !inComment) {
                    const restOfLine = line.substring(j + 2);
                    if (restOfLine.startsWith('[[')) {
                        inComment = true;
                        commentLevel = 0;
                        j += 3; // Skip past --[[
                        continue;
                    } else if (restOfLine.match(/^\[=*\[/)) {
                        const match = restOfLine.match(/^\[=*\[/);
                        commentLevel = match[0].match(/=/g)?.length || 0;
                        inComment = true;
                        j += match[0].length + 1; // Skip past --[=*[
                        continue;
                    } else {
                        break;
                    }
                }

                if (inComment && char === ']') {
                    const restOfLine = line.substring(j);
                    if (commentLevel === 0 && restOfLine.startsWith(']]')) {
                        inComment = false;
                        j += 1; // Skip past ]]
                        continue;
                    } else if (commentLevel > 0) {
                        const endPattern = new RegExp(`^\\]${'='.repeat(commentLevel)}\\]`);
                        if (endPattern.test(restOfLine)) {
                            inComment = false;
                            j += commentLevel + 1; // Skip past ]=*]
                            continue;
                        }
                    }
                }
            }

            if (inComment) continue;

            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            blockKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`);
                if (regex.test(trimmedLine) && !this.isInStringOrComment(line, keyword)) {
                    stack.push({ keyword, line: lineNumber });
                }
            });

            if (trimmedLine.includes('end') && !this.isInStringOrComment(line, 'end')) {
                if (stack.length === 0) {
                    errors.push({
                        line: lineNumber,
                        column: line.indexOf('end') + 1,
                        message: `Unexpected 'end' - no matching block statement`,
                        severity: 'error',
                        type: 'structure'
                    });
                } else {
                    const lastBlock = stack.pop();
                    if (lastBlock.keyword === 'repeat' && !trimmedLine.includes('until')) {
                        stack.push(lastBlock);
                    }
                }
            }

            if (trimmedLine.includes('until') && !this.isInStringOrComment(line, 'until')) {
                if (stack.length === 0 || stack[stack.length - 1].keyword !== 'repeat') {
                    errors.push({
                        line: lineNumber,
                        column: line.indexOf('until') + 1,
                        message: `'until' without matching 'repeat'`,
                        severity: 'error',
                        type: 'structure'
                    });
                } else {
                    stack.pop();
                }
            }
        }

        stack.forEach(block => {
            const endWord = block.keyword === 'repeat' ? 'until' : 'end';
            errors.push({
                line: block.line,
                column: 1,
                message: `Block '${block.keyword}' is not closed with '${endWord}'`,
                severity: 'error',
                type: 'structure'
            });
        });
    }

    isInStringOrComment(line, keyword) {
        const keywordIndex = line.indexOf(keyword);
        if (keywordIndex === -1) return false;

        let inString = false;
        let stringChar = '';
        let inComment = false;

        for (let i = 0; i < keywordIndex; i++) {
            const char = line[i];
            const nextChar = i < line.length - 1 ? line[i + 1] : '';
            const prevChar = i > 0 ? line[i - 1] : '';

            if (char === '-' && nextChar === '-' && !inString) {
                inComment = true;
                break;
            }

            if ((char === '"' || char === "'") && prevChar !== '\\' && !inComment) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = '';
                }
            }
        }

        return inString || inComment;
    }
} 