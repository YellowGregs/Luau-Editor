export function getLuaLanguageConfig(monaco) {
    return {
        // Language configuration
        languageConfiguration: {
            comments: {
                lineComment: '--',
                blockComment: ['--[[', ']]']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: '--[[', close: ']]' }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            folding: {
                markers: {
                    start: new RegExp('^\\s*--\\s*#region\\b'),
                    end: new RegExp('^\\s*--\\s*#endregion\\b')
                }
            },
            indentationRules: {
                increaseIndentPattern: new RegExp('^\\s*(function|if|for|while|repeat|do|then|else|elseif|local\\s+function)\\b.*$'),
                decreaseIndentPattern: new RegExp('^\\s*(end|else|elseif|until)\\b.*$')
            },
            onEnterRules: [
                {
                    beforeText: /^\s*(function|if|for|while|repeat|do|then|else|elseif)\b.*$/,
                    action: { indentAction: monaco.languages.IndentAction.Indent }
                },
                {
                    beforeText: /^\s*(end|else|elseif|until)\b.*$/,
                    action: { indentAction: monaco.languages.IndentAction.Outdent }
                }
            ]
        },

        // Monarch tokenizer
        monarchLanguage: {
            defaultToken: 'invalid',
            tokenPostfix: '.lua',

            keywords: [
                'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
                'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
                'repeat', 'return', 'then', 'true', 'until', 'while'
            ],

            luauKeywords: [
                'type', 'export', 'continue', 'typeof'
            ],

            builtins: [
                // Core functions
                'assert', 'collectgarbage', 'dofile', 'error', 'getfenv', 'getmetatable',
                'ipairs', 'load', 'loadfile', 'loadstring', 'module', 'next', 'pairs',
                'pcall', 'print', 'rawequal', 'rawget', 'rawlen', 'rawset', 'require',
                'select', 'setfenv', 'setmetatable', 'tonumber', 'tostring', 'type',
                'unpack', 'xpcall', '_G', '_VERSION',
                
                // String library
                'string.byte', 'string.char', 'string.dump', 'string.find', 'string.format',
                'string.gmatch', 'string.gsub', 'string.len', 'string.lower', 'string.match',
                'string.rep', 'string.reverse', 'string.sub', 'string.upper',
                
                // Table library
                'table.concat', 'table.insert', 'table.maxn', 'table.remove', 'table.sort',
                'table.pack', 'table.unpack', 'table.move', 'table.create', 'table.find',
                'table.foreach', 'table.foreachi', 'table.getn',
                
                // Math library
                'math.abs', 'math.acos', 'math.asin', 'math.atan', 'math.atan2', 'math.ceil',
                'math.cos', 'math.cosh', 'math.deg', 'math.exp', 'math.floor', 'math.fmod',
                'math.frexp', 'math.huge', 'math.ldexp', 'math.log', 'math.log10', 'math.max',
                'math.min', 'math.modf', 'math.pi', 'math.pow', 'math.rad', 'math.random',
                'math.randomseed', 'math.sin', 'math.sinh', 'math.sqrt', 'math.tan', 'math.tanh',
                'math.clamp', 'math.sign', 'math.round', 'math.noise',
                
                // IO library
                'io.close', 'io.flush', 'io.input', 'io.lines', 'io.open', 'io.output',
                'io.popen', 'io.read', 'io.stderr', 'io.stdin', 'io.stdout', 'io.tmpfile',
                'io.type', 'io.write',
                
                // OS library
                'os.clock', 'os.date', 'os.difftime', 'os.execute', 'os.exit', 'os.getenv',
                'os.remove', 'os.rename', 'os.setlocale', 'os.time', 'os.tmpname',
                
                // Coroutine library
                'coroutine.create', 'coroutine.resume', 'coroutine.running', 'coroutine.status',
                'coroutine.wrap', 'coroutine.yield', 'coroutine.isyieldable',
                
                // Debug library
                'debug.debug', 'debug.gethook', 'debug.getinfo', 'debug.getlocal',
                'debug.getmetatable', 'debug.getregistry', 'debug.getupvalue', 'debug.sethook',
                'debug.setlocal', 'debug.setmetatable', 'debug.setupvalue', 'debug.traceback',
                
                // Luau specific
                'warn', 'typeof', 'newproxy', 'gcinfo', 'bit32.arshift', 'bit32.band',
                'bit32.bnot', 'bit32.bor', 'bit32.btest', 'bit32.bxor', 'bit32.extract',
                'bit32.lrotate', 'bit32.lshift', 'bit32.replace', 'bit32.rrotate', 'bit32.rshift',
                'utf8.char', 'utf8.charpattern', 'utf8.codes', 'utf8.codepoint', 'utf8.len',
                'utf8.offset'
            ],

            typeAnnotations: [
                'string', 'number', 'boolean', 'table', 'function', 'thread', 'userdata',
                'any', 'unknown', 'never', 'nil'
            ],

            operators: [
                '+', '-', '*', '/', '%', '^', '#', '==', '~=', '<=', '>=', '<', '>',
                '=', '(', ')', '{', '}', '[', ']', ';', ':', ',', '.', '..', '...',
                '+=', '-=', '*=', '/=', '%=', '^=', '..='
            ],

            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

            tokenizer: {
                root: [
                    // Identifiers and keywords
                    [/[a-zA-Z_]\w*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@luauKeywords': 'keyword.luau',
                            '@builtins': 'predefined',
                            '@typeAnnotations': 'type',
                            '@default': 'identifier'
                        }
                    }],

                    // Type annotations
                    [/:\s*[a-zA-Z_]\w*/, 'type'],

                    // Whitespace
                    { include: '@whitespace' },

                    // Numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?[fF]?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/0[bB][01]+/, 'number.binary'],
                    [/\d+[fF]?/, 'number'],

                    // Delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // Strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string_double'],
                    [/'/, 'string', '@string_single'],
                    [/\[\[/, 'string', '@string_multiline'],
                    [/\[=*\[/, 'string', '@string_multiline_eq'],
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/--\[\[/, 'comment', '@comment_multiline'],
                    [/--\[=*\[/, 'comment', '@comment_multiline_eq'],
                    [/--.*$/, 'comment'],
                ],

                comment_multiline: [
                    [/[^\]]+/, 'comment'],
                    [/\]\]/, 'comment', '@pop'],
                    [/[\]]/, 'comment']
                ],

                comment_multiline_eq: [
                    [/[^\]]+/, 'comment'],
                    [/\]=*\]/, {
                        cases: {
                            '$S2===$1': { token: 'comment', next: '@pop' },
                            '@default': 'comment'
                        }
                    }],
                    [/[\]]/, 'comment']
                ],

                string_double: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, 'string', '@pop']
                ],

                string_single: [
                    [/[^\\']+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/'/, 'string', '@pop']
                ],

                string_multiline: [
                    [/[^\]]+/, 'string'],
                    [/\]\]/, 'string', '@pop'],
                    [/[\]]/, 'string']
                ],

                string_multiline_eq: [
                    [/[^\]]+/, 'string'],
                    [/\]=*\]/, {
                        cases: {
                            '$S2===$1': { token: 'string', next: '@pop' },
                            '@default': 'string'
                        }
                    }],
                    [/[\]]/, 'string']
                ]
            }
        },

        completionProvider: {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const luaLanguageConfig = getLuaLanguageConfig(monaco);

                const suggestions = [
                    // Lua keywords
                    ...luaLanguageConfig.monarchLanguage.keywords.map(keyword => ({
                        label: keyword,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: keyword,
                        range: range,
                        detail: 'Lua keyword',
                        sortText: '0' + keyword
                    })),

                    // Luau keywords
                    ...luaLanguageConfig.monarchLanguage.luauKeywords.map(keyword => ({
                        label: keyword,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: keyword,
                        range: range,
                        detail: 'Luau keyword',
                        sortText: '0' + keyword
                    })),

                    // Built-in functions
                    ...luaLanguageConfig.monarchLanguage.builtins.map(builtin => ({
                        label: builtin,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: builtin.includes('.') ? builtin : builtin + '(${1})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Built-in function',
                        sortText: '1' + builtin
                    })),

                    // Type annotations
                    ...luaLanguageConfig.monarchLanguage.typeAnnotations.map(type => ({
                        label: type,
                        kind: monaco.languages.CompletionItemKind.TypeParameter,
                        insertText: type,
                        range: range,
                        detail: 'Type annotation',
                        sortText: '2' + type
                    })),

                    {
                        label: 'function',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'function ${1:name}(${2:args})\n\t${3:-- function body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Function declaration',
                        documentation: 'Creates a new function with parameters',
                        sortText: '3function'
                    },
                    {
                        label: 'local function',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'local function ${1:name}(${2:args})\n\t${3:-- function body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Local function declaration',
                        documentation: 'Creates a local function with parameters',
                        sortText: '3localfunction'
                    },
                    {
                        label: 'if',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'if ${1:condition} then\n\t${2:-- if body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'If statement',
                        documentation: 'Conditional statement',
                        sortText: '3if'
                    },
                    {
                        label: 'if else',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'if ${1:condition} then\n\t${2:-- if body}\nelse\n\t${3:-- else body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'If-else statement',
                        documentation: 'Conditional statement with alternative',
                        sortText: '3ifelse'
                    },
                    {
                        label: 'if elseif else',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'if ${1:condition1} then\n\t${2:-- if body}\nelseif ${3:condition2} then\n\t${4:-- elseif body}\nelse\n\t${5:-- else body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'If-elseif-else statement',
                        documentation: 'Multiple conditional statement',
                        sortText: '3ifelseifelse'
                    },
                    {
                        label: 'for i',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'for ${1:i} = ${2:1}, ${3:10} do\n\t${4:-- loop body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Numeric for loop',
                        documentation: 'Iterates over a range of numbers',
                        sortText: '3fori'
                    },
                    {
                        label: 'for in pairs',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'for ${1:key}, ${2:value} in pairs(${3:table}) do\n\t${4:-- loop body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'For-in pairs loop',
                        documentation: 'Iterates over all key-value pairs in a table',
                        sortText: '3forpairs'
                    },
                    {
                        label: 'for in ipairs',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'for ${1:index}, ${2:value} in ipairs(${3:array}) do\n\t${4:-- loop body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'For-in ipairs loop',
                        documentation: 'Iterates over array elements with indices',
                        sortText: '3foripairs'
                    },
                    {
                        label: 'while',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'while ${1:condition} do\n\t${2:-- loop body}\nend',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'While loop',
                        documentation: 'Repeats while condition is true',
                        sortText: '3while'
                    },
                    {
                        label: 'repeat until',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'repeat\n\t${1:-- loop body}\nuntil ${2:condition}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Repeat-until loop',
                        documentation: 'Repeats until condition becomes true',
                        sortText: '3repeat'
                    },
                    {
                        label: 'local',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'local ${1:variable} = ${2:value}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Local variable declaration',
                        documentation: 'Declares a local variable',
                        sortText: '3local'
                    },
                    {
                        label: 'table',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '{\n\t${1:-- table content}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Table literal',
                        documentation: 'Creates a new table',
                        sortText: '3table'
                    },
                    {
                        label: 'table with values',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '{\n\t${1:key1} = ${2:value1},\n\t${3:key2} = ${4:value2}\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Table with key-value pairs',
                        documentation: 'Creates a table with initial values',
                        sortText: '3tablevalues'
                    },
                    {
                        label: 'array',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '{${1:value1}, ${2:value2}, ${3:value3}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Array literal',
                        documentation: 'Creates an array with initial values',
                        sortText: '3array'
                    },
                    {
                        label: 'print',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'print(${1:message})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Print statement',
                        documentation: 'Prints a message to the console',
                        sortText: '3print'
                    },
                    {
                        label: 'require',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'require("${1:module}")',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Require module',
                        documentation: 'Loads and returns a module',
                        sortText: '3require'
                    },
                    {
                        label: 'pcall',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'local ${1:success}, ${2:result} = pcall(${3:function}, ${4:args})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        detail: 'Protected call',
                        documentation: 'Calls function in protected mode',
                        sortText: '3pcall'
                    }
                ];

                return { suggestions };
            }
        }
    };
} 