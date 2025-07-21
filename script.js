import { getLuaLanguageConfig } from './lua-language.js';
import { LuaValidator } from './lua-validator.js';
import { AIAssistant } from './ai-assistant.js';

class LuaEditor {
    constructor() {
        this.editor = null;
        this.tabs = new Map();
        this.folders = new Map();
        this.activeTabId = 1;
        this.tabCounter = 1;
        this.contextMenu = document.getElementById('contextMenu');
        this.explorerContextMenu = document.getElementById('explorerContextMenu');
        this.fileContextMenu = document.getElementById('fileContextMenu');
        this.validator = new LuaValidator();
        this.decorations = [];
        this.isCreatingTab = false;
        this.activeSidebarTab = 'scripts';
        this.typingAnimationTimeout = null;
        this.expandedFolders = new Set();
        this.draggedItem = null;
        this.aiAssistant = null;
        this.contextTarget = null;
        this.isResizing = false;
        this.sidebarWidth = 300;
        this.tabScrollPosition = 0;
        this.deleteCallback = null;
        
        window.luaEditor = this;
        window.getEditorValue = () => this.editor ? this.editor.getValue() : '';
        window.setEditorValue = (content) => {
            if (this.editor) {
                this.editor.setValue(content);
                this.saveCurrentTabContent();
                this.validateCode();
            }
        };
        window.getActiveTabName = () => {
            const tab = this.tabs.get(this.activeTabId);
            return tab ? tab.name : '';
        };
        window.createNewTab = (name, content) => {
            this.createNewTab('scripts', name, content);
        };
        
        this.init();
    }

    async init() {
        await this.initializeMonaco();
        this.setupEventListeners();
        this.createInitialStructure();
        this.updateStatusBar();
        this.optimizeEditor();
        this.setupSidebar();
        this.renderScriptsList();
        this.setupDragAndDrop();
        this.setupContextMenus();
        this.setupSidebarResize();
        this.setupModal();
        this.setupDeleteModal();
        this.setupTabScrolling();
        this.initializeAI();
    }

    initializeAI() {
        this.aiAssistant = new AIAssistant();
    }

    async initializeMonaco() {
        return new Promise((resolve) => {
            require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
            require(['vs/editor/editor.main'], () => {
                const luaLanguageConfig = getLuaLanguageConfig(monaco);
                
                monaco.languages.register({ id: 'lua' });
                
                monaco.languages.setLanguageConfiguration('lua', luaLanguageConfig.languageConfiguration);
                
                monaco.languages.setMonarchTokensProvider('lua', luaLanguageConfig.monarchLanguage);
                
                monaco.languages.registerCompletionItemProvider('lua', luaLanguageConfig.completionProvider);

                monaco.editor.defineTheme('syther-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'keyword', foreground: '#dc2626', fontStyle: 'bold' },
                        { token: 'keyword.luau', foreground: '#a855f7', fontStyle: 'bold' },
                        { token: 'string', foreground: '#f97316' },
                        { token: 'string.escape', foreground: '#fbbf24', fontStyle: 'bold' },
                        { token: 'number', foreground: '#22c55e' },
                        { token: 'number.float', foreground: '#22c55e' },
                        { token: 'number.hex', foreground: '#22c55e' },
                        { token: 'number.binary', foreground: '#22c55e' },
                        { token: 'comment', foreground: '#737373', fontStyle: 'italic' },
                        { token: 'predefined', foreground: '#fbbf24', fontStyle: 'bold' },
                        { token: 'type', foreground: '#3b82f6' },
                        { token: 'operator', foreground: '#f5f5f5' },
                        { token: 'identifier', foreground: '#d4d4d4' },
                        { token: 'delimiter', foreground: '#f5f5f5' },
                        { token: 'bracket', foreground: '#dc2626' }
                    ],
                    colors: {
                        'editor.background': '#0d0d0d',
                        'editor.foreground': '#f5f5f5',
                        'editor.lineHighlightBackground': '#1a1a1a',
                        'editor.selectionBackground': '#991b1b',
                        'editor.inactiveSelectionBackground': '#262626',
                        'editorCursor.foreground': '#dc2626',
                        'editorWhitespace.foreground': '#404040',
                        'editorIndentGuide.background': '#404040',
                        'editorIndentGuide.activeBackground': '#737373',
                        'editor.findMatchBackground': '#7f1d1d',
                        'editor.findMatchHighlightBackground': '#dc262640',
                        'editorLineNumber.foreground': '#737373',
                        'editorLineNumber.activeForeground': '#f5f5f5',
                        'editorBracketMatch.background': '#dc262620',
                        'editorBracketMatch.border': '#dc2626'
                    }
                });

                this.editor = monaco.editor.create(document.getElementById('editor'), {
                    value: '',
                    language: 'lua',
                    theme: 'syther-dark',
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontLigatures: true,
                    tabSize: 4,
                    insertSpaces: true,
                    wordWrap: 'on',
                    wrappingIndent: 'indent',
                    lineNumbers: 'on',
                    lineNumbersMinChars: 3,
                    renderWhitespace: 'selection',
                    minimap: { 
                        enabled: true,
                        side: 'right',
                        size: 'proportional',
                        showSlider: 'mouseover'
                    },
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8
                    },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    mouseWheelZoom: true,
                    bracketPairColorization: { enabled: true },
                    guides: {
                        bracketPairs: true,
                        indentation: true
                    },
                    suggest: {
                        showKeywords: true,
                        showSnippets: true,
                        showFunctions: true,
                        showVariables: true,
                        insertMode: 'replace',
                        snippetsPreventQuickSuggestions: false
                    },
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false
                    },
                    parameterHints: { enabled: true },
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    autoSurround: 'languageDefined',
                    formatOnPaste: true,
                    formatOnType: true,
                    autoIndent: 'full',
                    detectIndentation: false,
                    trimAutoWhitespace: true,
                    renderLineHighlight: 'line',
                    selectionHighlight: true,
                    occurrencesHighlight: true,
                    codeLens: false,
                    folding: true,
                    foldingStrategy: 'indentation',
                    showFoldingControls: 'mouseover',
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    tabCompletion: 'on'
                });

                resolve();
            });
        });
    }

    optimizeEditor() {
        let validationTimeout;
        const debouncedValidation = () => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => this.validateCode(), 300);
        };

        this.debouncedValidateCode = debouncedValidation;
        this.renderTabs = this.debounce(this.renderTabs.bind(this), 100);
        this.renderScriptsList = this.debounce(this.renderScriptsList.bind(this), 100);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    setupModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalInput = document.getElementById('modalInput');

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.hideModal();
            }
        });

        modalClose.addEventListener('click', () => {
            this.hideModal();
        });

        modalCancel.addEventListener('click', () => {
            this.hideModal();
        });

        modalConfirm.addEventListener('click', () => {
            const value = modalInput.value.trim();
            if (value && this.modalCallback) {
                this.modalCallback(value);
            }
            this.hideModal();
        });

        modalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                modalConfirm.click();
            } else if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    setupDeleteModal() {
        const deleteModalOverlay = document.getElementById('deleteModalOverlay');
        const deleteModalClose = document.getElementById('deleteModalClose');
        const deleteModalCancel = document.getElementById('deleteModalCancel');
        const deleteModalConfirm = document.getElementById('deleteModalConfirm');

        deleteModalOverlay.addEventListener('click', (e) => {
            if (e.target === deleteModalOverlay) {
                this.hideDeleteModal();
            }
        });

        deleteModalClose.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        deleteModalCancel.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        deleteModalConfirm.addEventListener('click', () => {
            if (this.deleteCallback) {
                this.deleteCallback();
            }
            this.hideDeleteModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteModalOverlay.classList.contains('visible')) {
                this.hideDeleteModal();
            }
        });
    }

    showDeleteModal(itemName, itemType, callback) {
        const deleteModalOverlay = document.getElementById('deleteModalOverlay');
        const deleteModalTitle = document.getElementById('deleteModalTitle');
        const deleteItemName = document.getElementById('deleteItemName');
        const deleteItemType = document.getElementById('deleteItemType');
        const deleteItemIcon = document.getElementById('deleteItemIcon');

        deleteModalTitle.textContent = `Delete ${itemType}`;
        deleteItemName.textContent = itemName;
        deleteItemType.textContent = itemType;

        if (itemType === 'Folder') {
            deleteItemIcon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
        } else {
            deleteItemIcon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
        }

        this.deleteCallback = callback;
        deleteModalOverlay.classList.add('visible');
    }

    hideDeleteModal() {
        const deleteModalOverlay = document.getElementById('deleteModalOverlay');
        deleteModalOverlay.classList.remove('visible');
        this.deleteCallback = null;
    }

    showModal(title, label, placeholder, currentValue = '', callback) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalLabel = document.getElementById('modalLabel');
        const modalInput = document.getElementById('modalInput');

        modalTitle.textContent = title;
        modalLabel.textContent = label;
        modalInput.placeholder = placeholder;
        modalInput.value = currentValue;
        this.modalCallback = callback;

        modalOverlay.classList.add('visible');
        setTimeout(() => {
            modalInput.focus();
            modalInput.select();
        }, 100);
    }

    hideModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        modalOverlay.classList.remove('visible');
        this.modalCallback = null;
    }

    setupTabScrolling() {
        const tabScrollLeft = document.getElementById('tabScrollLeft');
        const tabScrollRight = document.getElementById('tabScrollRight');
        const tabsContainer = document.getElementById('tabsContainer');

        tabScrollLeft.addEventListener('click', () => {
            this.scrollTabs(-150);
        });

        tabScrollRight.addEventListener('click', () => {
            this.scrollTabs(150);
        });

        tabsContainer.addEventListener('scroll', () => {
            this.updateScrollButtons();
        });

        const observer = new MutationObserver(() => {
            this.updateScrollButtons();
        });
        
        observer.observe(tabsContainer, { 
            childList: true, 
            subtree: true 
        });

        this.updateScrollButtons();
    }

    scrollTabs(delta) {
        const tabsContainer = document.getElementById('tabsContainer');
        tabsContainer.scrollLeft += delta;
    }

    updateScrollButtons() {
        const tabsContainer = document.getElementById('tabsContainer');
        const tabScrollLeft = document.getElementById('tabScrollLeft');
        const tabScrollRight = document.getElementById('tabScrollRight');

        if (!tabsContainer) return;

        const canScrollLeft = tabsContainer.scrollLeft > 0;
        const canScrollRight = tabsContainer.scrollLeft < (tabsContainer.scrollWidth - tabsContainer.clientWidth);
        const needsScrolling = tabsContainer.scrollWidth > tabsContainer.clientWidth;

        if (needsScrolling) {
            tabScrollLeft.style.display = canScrollLeft ? 'flex' : 'none';
            tabScrollRight.style.display = canScrollRight ? 'flex' : 'none';
            
            if (canScrollLeft) {
                tabsContainer.style.paddingLeft = '36px';
            } else {
                tabsContainer.style.paddingLeft = '8px';
            }
            
            if (canScrollRight) {
                tabsContainer.style.paddingRight = '36px';
            } else {
                tabsContainer.style.paddingRight = '8px';
            }
        } else {
            tabScrollLeft.style.display = 'none';
            tabScrollRight.style.display = 'none';
            tabsContainer.style.paddingLeft = '8px';
            tabsContainer.style.paddingRight = '8px';
        }
    }

    setupSidebar() {
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchSidebarTab(tabName);
            });
        });
    }

    setupSidebarResize() {
        const resizeHandle = document.getElementById('sidebarResizeHandle');
        const sidebar = document.getElementById('sidebar');

        resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const startX = e.clientX;
            const startWidth = this.sidebarWidth;

            const handleMouseMove = (e) => {
                if (!this.isResizing) return;

                const deltaX = e.clientX - startX;
                const newWidth = Math.max(200, Math.min(600, startWidth + deltaX));
                
                this.sidebarWidth = newWidth;
                sidebar.style.width = `${newWidth}px`;
                
                document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
                
                if (this.editor) {
                    this.editor.layout();
                }
            };

            const handleMouseUp = () => {
                this.isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    switchSidebarTab(tabName) {
        this.activeSidebarTab = tabName;
        
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Content');
        });
    }

    setupDragAndDrop() {
        // This will be set up when rendering the scripts list
    }

    setupContextMenus() {
        document.getElementById('scriptsList').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const scriptItem = e.target.closest('.script-item');
            const folderHeader = e.target.closest('.folder-header');
            
            if (scriptItem) {
                this.contextTarget = {
                    type: 'file',
                    id: parseInt(scriptItem.dataset.tabId)
                };
                this.showFileContextMenu(e);
            } else if (folderHeader) {
                this.contextTarget = {
                    type: 'folder',
                    id: folderHeader.dataset.folderId
                };
                this.showFileContextMenu(e);
            } else {
                this.showExplorerContextMenu(e);
            }
        });

        this.explorerContextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleExplorerContextAction(action);
            }
            this.hideAllContextMenus();
        });

        this.fileContextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleFileContextAction(action);
            }
            this.hideAllContextMenus();
        });

        this.contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleContextAction(action);
            }
            this.hideAllContextMenus();
        });

        document.addEventListener('click', () => {
            this.hideAllContextMenus();
        });
    }

    showExplorerContextMenu(e) {
        this.hideAllContextMenus();
        this.explorerContextMenu.style.display = 'block';
        this.explorerContextMenu.style.left = `${e.pageX}px`;
        this.explorerContextMenu.style.top = `${e.pageY}px`;
    }

    showFileContextMenu(e) {
        this.hideAllContextMenus();
        this.fileContextMenu.style.display = 'block';
        this.fileContextMenu.style.left = `${e.pageX}px`;
        this.fileContextMenu.style.top = `${e.pageY}px`;
    }

    hideAllContextMenus() {
        this.explorerContextMenu.style.display = 'none';
        this.fileContextMenu.style.display = 'none';
        this.contextMenu.style.display = 'none';
    }

    handleExplorerContextAction(action) {
        switch (action) {
            case 'newFile':
                this.createNewTab();
                break;
            case 'newFolder':
                this.createNewFolder();
                break;
        }
    }

    handleFileContextAction(action) {
        if (!this.contextTarget) return;

        switch (action) {
            case 'rename':
                if (this.contextTarget.type === 'file') {
                    this.renameTab(this.contextTarget.id);
                } else if (this.contextTarget.type === 'folder') {
                    this.renameFolder(this.contextTarget.id);
                }
                break;
            case 'duplicate':
                if (this.contextTarget.type === 'file') {
                    this.duplicateTab(this.contextTarget.id);
                } else if (this.contextTarget.type === 'folder') {
                    this.duplicateFolder(this.contextTarget.id);
                }
                break;
            case 'delete':
                if (this.contextTarget.type === 'file') {
                    this.deleteFile(this.contextTarget.id);
                } else if (this.contextTarget.type === 'folder') {
                    this.deleteFolder(this.contextTarget.id);
                }
                break;
        }
        this.contextTarget = null;
    }

    deleteFile(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        this.showDeleteModal(tab.name, 'File', () => {
            this.closeTab(tabId);
            this.showNotification(`Deleted ${tab.name}`);
        });
    }

    deleteFolder(folderId) {
        const folder = this.folders.get(folderId);
        if (!folder) return;

        const fileCount = folder.files.length;
        const folderDescription = fileCount > 0 ? 
            `Folder (${fileCount} file${fileCount !== 1 ? 's' : ''})` : 
            'Folder';

        this.showDeleteModal(folder.name, folderDescription, () => {
            // Delete all files in the folder
            folder.files.forEach(fileId => {
                this.tabs.delete(fileId);
                if (this.activeTabId === fileId) {
                    const firstTabId = this.tabs.keys().next().value;
                    if (firstTabId) {
                        this.switchTab(firstTabId);
                    }
                }
            });

            this.folders.delete(folderId);
            this.expandedFolders.delete(folderId);
            this.renderTabs();
            this.renderScriptsList();
            this.showNotification(`Deleted folder ${folder.name}`);
        });
    }

    renameFolder(folderId) {
        const folder = this.folders.get(folderId);
        if (!folder) return;

        this.showModal(
            'Rename Folder',
            'Folder name:',
            'Enter folder name...',
            folder.name,
            (newName) => {
                if (newName && newName.trim()) {
                    folder.name = newName.trim();
                    this.renderScriptsList();
                    this.showNotification('Folder renamed');
                }
            }
        );
    }

    duplicateFolder(folderId) {
        const folder = this.folders.get(folderId);
        if (!folder) return;

        const newFolderId = folder.id + '-copy-' + Date.now();
        const newFolder = {
            id: newFolderId,
            name: folder.name + ' Copy',
            expanded: false,
            files: []
        };

        // Duplicate all files in the folder
        folder.files.forEach(fileId => {
            const originalTab = this.tabs.get(fileId);
            if (originalTab) {
                this.tabCounter++;
                const newTab = {
                    id: this.tabCounter,
                    name: originalTab.name.replace('.lua', '') + '_copy.lua',
                    content: originalTab.content,
                    saved: false,
                    errors: [],
                    folder: newFolderId
                };
                
                this.tabs.set(this.tabCounter, newTab);
                newFolder.files.push(this.tabCounter);
            }
        });

        this.folders.set(newFolderId, newFolder);
        this.renderScriptsList();
        this.renderTabs();
        this.showNotification(`Duplicated folder ${folder.name}`);
    }

    createNewFolder() {
        this.showModal(
            'New Folder',
            'Folder name:',
            'Enter folder name...',
            '',
            (folderName) => {
                if (folderName && folderName.trim()) {
                    const folderId = folderName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
                    
                    this.folders.set(folderId, {
                        id: folderId,
                        name: folderName.trim(),
                        expanded: true,
                        files: []
                    });

                    this.expandedFolders.add(folderId);
                    this.renderScriptsList();
                    this.showNotification(`Folder "${folderName}" created`);
                }
            }
        );
    }

    setupEventListeners() {
        document.getElementById('newTabBtn').addEventListener('click', () => {
            if (!this.isCreatingTab) {
                this.createNewTab();
            }
        });

        document.getElementById('tabBar').addEventListener('click', (e) => {
            if (e.target.closest('.tab-close')) {
                const tabId = parseInt(e.target.closest('.tab-close').dataset.tabId);
                this.closeTab(tabId);
            } else if (e.target.closest('.tab')) {
                const tabId = parseInt(e.target.closest('.tab').dataset.tabId);
                this.switchTab(tabId);
            }
        });

        document.getElementById('tabBar').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const tab = e.target.closest('.tab');
            if (tab) {
                this.showContextMenu(e, parseInt(tab.dataset.tabId));
            }
        });

        document.getElementById('errorClose').addEventListener('click', () => {
            this.hideErrorPanel();
        });

        if (this.editor) {
            this.editor.onDidChangeCursorPosition(() => {
                this.updateStatusBar();
            });

            this.editor.onDidChangeModelContent(() => {
                this.updateStatusBar();
                this.saveCurrentTabContent();
                this.debouncedValidateCode();
                this.addTypingAnimation();
                this.renderScriptsList();
            });
            
            const resizeObserver = new ResizeObserver(() => {
                this.editor.layout();
            });
            resizeObserver.observe(document.getElementById('editor'));
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.createNewTab();
                        break;
                    case 'w':
                        e.preventDefault();
                        this.closeTab(this.activeTabId);
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentTab();
                        break;
                }
            }
        });

        window.addEventListener('resize', () => {
            this.adjustTabSizes();
            this.updateScrollButtons();
            if (this.editor) {
                this.editor.layout();
            }
        });
    }

    addTypingAnimation() {
        clearTimeout(this.typingAnimationTimeout);
        
        const editorElement = document.querySelector('.monaco-editor');
        if (editorElement) {
            editorElement.style.filter = 'brightness(1.02)';
            
            this.typingAnimationTimeout = setTimeout(() => {
                editorElement.style.filter = 'brightness(1)';
            }, 150);
        }
    }

    createInitialStructure() {
        this.folders.set('scripts', {
            id: 'scripts',
            name: 'Scripts',
            expanded: true,
            files: [1]
        });

        this.folders.set('folder-1', {
            id: 'folder-1',
            name: 'Folder 1',
            expanded: false,
            files: []
        });

        this.expandedFolders.add('scripts');

        const tab = {
            id: 1,
            name: 'main.lua',
            content: `-- Syther Executor
-- Editor Design by YellowGreg, Wspboy12`,
            saved: true,
            errors: [],
            folder: 'scripts'
        };
        
        this.tabs.set(1, tab);
        this.editor.setValue(tab.content);
        this.renderTabs();
        this.validateCode();
    }

    createNewTab(folderName = 'scripts', name = null, content = null) {
        if (this.isCreatingTab) return;
        
        this.isCreatingTab = true;
        this.tabCounter++;
        
        const tab = {
            id: this.tabCounter,
            name: name || `script${this.tabCounter}.lua`,
            content: content || '-- New Script\n\n',
            saved: true,
            errors: [],
            folder: folderName
        };
        
        this.tabs.set(this.tabCounter, tab);
        const folder = this.folders.get(folderName);
        if (folder) {
            folder.files.push(this.tabCounter);
        }
        
        this.switchTab(this.tabCounter);
        this.renderTabs();
        this.renderScriptsList();
        
        setTimeout(() => {
            this.isCreatingTab = false;
        }, 300);
        
        this.showNotification('New tab created');
    }

    closeTab(tabId) {
        if (this.tabs.size <= 1) {
            this.showNotification('Cannot close the last tab', 'warning');
            return;
        }
        
        const tab = this.tabs.get(tabId);
        if (tab && tab.folder) {
            const folder = this.folders.get(tab.folder);
            if (folder) {
                folder.files = folder.files.filter(id => id !== tabId);
            }
        }
        
        this.tabs.delete(tabId);
        
        if (this.activeTabId === tabId) {
            const firstTabId = this.tabs.keys().next().value;
            this.switchTab(firstTabId);
        }
        
        this.renderTabs();
        this.renderScriptsList();
        this.showNotification('Tab closed');
    }

    switchTab(tabId) {
        if (!this.tabs.has(tabId)) return;
        
        this.saveCurrentTabContent();
        this.activeTabId = tabId;
        const tab = this.tabs.get(tabId);
        
        if (this.editor) {
            this.editor.setValue(tab.content);
        }
        
        this.renderTabs();
        this.renderScriptsList();
        this.updateStatusBar();
        this.validateCode();
    }

    saveCurrentTabContent() {
        if (this.editor && this.tabs.has(this.activeTabId)) {
            const tab = this.tabs.get(this.activeTabId);
            tab.content = this.editor.getValue();
            tab.saved = false;
        }
    }

    saveCurrentTab() {
        if (this.tabs.has(this.activeTabId)) {
            const tab = this.tabs.get(this.activeTabId);
            tab.saved = true;
            this.renderTabs();
            this.renderScriptsList();
            this.showNotification(`Saved ${tab.name}`);
        }
    }

    adjustTabSizes() {
        const tabsContainer = document.querySelector('.tabs-container');
        const tabs = document.querySelectorAll('.tab');
        
        if (!tabsContainer || tabs.length === 0) return;
        
        const containerWidth = tabsContainer.clientWidth;
        const tabCount = tabs.length;
        const minTabWidth = 60;
        const maxTabWidth = 200;
        
        let tabWidth = Math.max(minTabWidth, Math.min(maxTabWidth, containerWidth / tabCount));
        
        tabs.forEach(tab => {
            tab.classList.remove('narrow', 'very-narrow');
            
            if (tabWidth < 80) {
                tab.classList.add('very-narrow');
            } else if (tabWidth < 120) {
                tab.classList.add('narrow');
            }
        });
    }

    renderTabs() {
        const tabsContainer = document.querySelector('.tabs-container');
        if (!tabsContainer) return;
        
        const existingTabs = tabsContainer.querySelectorAll('.tab');
        existingTabs.forEach(tab => tab.remove());
        
        this.tabs.forEach((tab) => {
            const tabElement = document.createElement('div');
            tabElement.className = `tab ${tab.id === this.activeTabId ? 'active' : ''}`;
            tabElement.dataset.tabId = tab.id;
            
            const hasErrors = tab.errors && tab.errors.some(e => e.severity === 'error');
            const hasWarnings = tab.errors && tab.errors.some(e => e.severity === 'warning');
            const errorClass = hasErrors ? 'has-errors' : hasWarnings ? 'has-warnings' : '';
            
            tabElement.innerHTML = `
                <div class="tab-icon ${errorClass}">
                    ${hasErrors ? `
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="2"/>
                            <path d="M7 3V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M7 10H7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    ` : hasWarnings ? `
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1L13 13H1L7 1Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M7 5V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M7 11H7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    ` : `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    `}
                </div>
                <span class="tab-name">${tab.name}${tab.saved ? '' : ' •'}</span>
                <button class="tab-close" data-tab-id="${tab.id}">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            `;
            
            tabsContainer.appendChild(tabElement);
        });
        
        setTimeout(() => {
            this.adjustTabSizes();
            this.updateScrollButtons();
        }, 0);
    }

    toggleFolder(folderId) {
        if (this.expandedFolders.has(folderId)) {
            this.expandedFolders.delete(folderId);
        } else {
            this.expandedFolders.add(folderId);
        }
        this.renderScriptsList();
    }

    moveFileToFolder(fileId, targetFolderId) {
        const tab = this.tabs.get(fileId);
        if (!tab) return;

        const currentFolder = this.folders.get(tab.folder);
        if (currentFolder) {
            currentFolder.files = currentFolder.files.filter(id => id !== fileId);
        }

        const targetFolder = this.folders.get(targetFolderId);
        if (targetFolder) {
            targetFolder.files.push(fileId);
            tab.folder = targetFolderId;
        }

        this.renderScriptsList();
        this.showNotification(`Moved ${tab.name} to ${targetFolder.name}`);
    }

    renderScriptsList() {
        const scriptsList = document.getElementById('scriptsList');
        scriptsList.innerHTML = '';

        this.folders.forEach((folder) => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder-item';
            
            const isExpanded = this.expandedFolders.has(folder.id);
            
            folderElement.innerHTML = `
                <div class="folder-header ${isExpanded ? 'expanded' : ''}" data-folder-id="${folder.id}">
                    <div class="folder-icon">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="folder-name">${folder.name}</div>
                    <button class="folder-add-btn" data-folder-id="${folder.id}">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1V15M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="folder-contents ${isExpanded ? 'expanded' : ''}">
                    ${folder.files.map(fileId => {
                        const tab = this.tabs.get(fileId);
                        if (!tab) return '';
                        
                        const hasErrors = tab.errors && tab.errors.some(e => e.severity === 'error');
                        const hasWarnings = tab.errors && tab.errors.some(e => e.severity === 'warning');
                        const errorClass = hasErrors ? 'has-errors' : hasWarnings ? 'has-warnings' : '';
                        
                        return `
                            <div class="script-item ${tab.id === this.activeTabId ? 'active' : ''} ${errorClass}" 
                                 data-tab-id="${tab.id}" 
                                 draggable="true">
                                <div class="script-icon">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                                        <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div class="script-name">${tab.name}</div>
                                <div class="script-status">${tab.saved ? 'Saved' : 'Modified'}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            scriptsList.appendChild(folderElement);
        });

        document.querySelectorAll('.folder-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('.folder-add-btn')) {
                    const folderId = header.dataset.folderId;
                    this.toggleFolder(folderId);
                }
            });

            header.addEventListener('dragover', (e) => {
                e.preventDefault();
                header.classList.add('drag-over');
            });

            header.addEventListener('dragleave', () => {
                header.classList.remove('drag-over');
            });

            header.addEventListener('drop', (e) => {
                e.preventDefault();
                header.classList.remove('drag-over');
                
                if (this.draggedItem) {
                    const fileId = parseInt(this.draggedItem.dataset.tabId);
                    const targetFolderId = header.dataset.folderId;
                    this.moveFileToFolder(fileId, targetFolderId);
                    this.draggedItem = null;
                }
            });
        });

        document.querySelectorAll('.folder-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderId = btn.dataset.folderId;
                this.createNewTab(folderId);
            });
        });

        document.querySelectorAll('.script-item').forEach(item => {
            item.addEventListener('click', () => {
                const tabId = parseInt(item.dataset.tabId);
                this.switchTab(tabId);
            });

            item.addEventListener('dragstart', (e) => {
                this.draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedItem = null;
            });
        });
    }

    validateCode() {
        if (!this.editor) return;

        const code = this.editor.getValue();
        const errors = this.validator.validate(code);
        
        const currentTab = this.tabs.get(this.activeTabId);
        if (currentTab) {
            currentTab.errors = errors;
        }

        this.decorations = this.editor.deltaDecorations(this.decorations, []);

        const newDecorations = errors.map(error => ({
            range: new monaco.Range(error.line, error.column, error.line, error.column + 5),
            options: {
                isWholeLine: false,
                className: error.severity === 'error' ? 'error-decoration' : 'warning-decoration',
                hoverMessage: { value: `**${error.type.toUpperCase()}**: ${error.message}` },
                glyphMarginClassName: error.severity === 'error' ? 'error-glyph' : 'warning-glyph'
            }
        }));

        this.decorations = this.editor.deltaDecorations([], newDecorations);

        this.updateErrorPanel(errors);
        this.updateStatusBar();
        this.renderTabs();
        this.renderScriptsList();
    }

    updateErrorPanel(errors) {
        const errorPanel = document.getElementById('errorPanel');
        const errorList = document.getElementById('errorList');

        if (errors.length === 0) {
            errorPanel.classList.remove('visible');
            return;
        }

        errorPanel.classList.add('visible');
        errorList.innerHTML = '';

        const errorsByType = errors.reduce((acc, error) => {
            if (!acc[error.severity]) acc[error.severity] = [];
            acc[error.severity].push(error);
            return acc;
        }, {});

        ['error', 'warning', 'info'].forEach(severity => {
            if (errorsByType[severity]) {
                errorsByType[severity].forEach(error => {
                    const errorItem = document.createElement('div');
                    errorItem.className = `error-item ${error.severity}`;
                    errorItem.innerHTML = `
                        <div class="error-icon">
                            ${error.severity === 'error' ? `
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
                                    <path d="M8 4V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M8 12H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            ` : error.severity === 'warning' ? `
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" stroke-width="2"/>
                                    <path d="M8 6V10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M8 13H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            ` : `
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
                                    <path d="M8 11H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            `}
                        </div>
                        <div class="error-details">
                            <div class="error-message">${error.message}</div>
                            <div class="error-location">Line ${error.line}, Col ${error.column} • ${error.type}</div>
                        </div>
                    `;

                    errorItem.addEventListener('click', () => {
                        this.editor.setPosition({ lineNumber: error.line, column: error.column });
                        this.editor.focus();
                        this.editor.revealLineInCenter(error.line);
                    });

                    errorList.appendChild(errorItem);
                });
            }
        });
    }

    hideErrorPanel() {
        document.getElementById('errorPanel').classList.remove('visible');
    }

    showContextMenu(e, tabId) {
        this.contextTabId = tabId;
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = `${e.pageX}px`;
        this.contextMenu.style.top = `${e.pageY}px`;
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }

    handleContextAction(action) {
        switch (action) {
            case 'save':
                this.saveTab(this.contextTabId);
                break;
            case 'rename':
                this.renameTab(this.contextTabId);
                break;
            case 'duplicate':
                this.duplicateTab(this.contextTabId);
                break;
            case 'close':
                this.closeTab(this.contextTabId);
                break;
            case 'closeOthers':
                this.closeOtherTabs(this.contextTabId);
                break;
        }
    }

    saveTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.saved = true;
            this.renderTabs();
            this.renderScriptsList();
            this.showNotification(`Saved ${tab.name}`);
        }
    }

    renameTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;
        
        this.showModal(
            'Rename File',
            'File name:',
            'Enter file name...',
            tab.name,
            (newName) => {
                if (newName && newName.trim()) {
                    let finalName = newName.trim();
                    
                    if (!finalName.endsWith('.lua')) {
                        finalName += '.lua';
                    }
                    
                    tab.name = finalName;
                    this.renderTabs();
                    this.renderScriptsList();
                    this.showNotification('File renamed');
                }
            }
        );
    }

    duplicateTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;
        
        this.tabCounter++;
        const newTab = {
            id: this.tabCounter,
            name: `${tab.name.replace('.lua', '')}_copy.lua`,
            content: tab.content,
            saved: false,
            errors: [],
            folder: tab.folder
        };
        
        this.tabs.set(this.tabCounter, newTab);
        
        const folder = this.folders.get(tab.folder);
        if (folder) {
            folder.files.push(this.tabCounter);
        }
        
        this.switchTab(this.tabCounter);
        this.renderTabs();
        this.renderScriptsList();
        this.showNotification('File duplicated');
    }

    closeOtherTabs(keepTabId) {
        const tabsToClose = Array.from(this.tabs.keys()).filter(id => id !== keepTabId);
        
        tabsToClose.forEach(id => {
            const tab = this.tabs.get(id);
            if (tab && tab.folder) {
                const folder = this.folders.get(tab.folder);
                if (folder) {
                    folder.files = folder.files.filter(fileId => fileId !== id);
                }
            }
            this.tabs.delete(id);
        });
        
        if (this.activeTabId !== keepTabId) {
            this.switchTab(keepTabId);
        }
        
        this.renderTabs();
        this.renderScriptsList();
        this.showNotification('Other tabs closed');
    }

    updateStatusBar() {
        if (!this.editor) return;
        
        const position = this.editor.getPosition();
        const model = this.editor.getModel();
        const currentTab = this.tabs.get(this.activeTabId);
        
        if (position && model) {
            document.getElementById('lineCol').textContent = 
                `Ln ${position.lineNumber}, Col ${position.column}`;
            
            document.getElementById('charCount').textContent = 
                `${model.getValue().length} chars`;
        }

        const errorCount = currentTab?.errors?.length || 0;
        const errorCountEl = document.getElementById('errorCount');
        if (errorCount === 0) {
            errorCountEl.textContent = 'No issues';
            errorCountEl.className = 'status-item';
        } else {
            const hasErrors = currentTab.errors.some(e => e.severity === 'error');
            const errorSeverity = hasErrors ? 'error' : 'warning';
            errorCountEl.textContent = `${errorCount} ${errorCount === 1 ? 'issue' : 'issues'}`;
            errorCountEl.className = `status-item ${errorSeverity}`;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LuaEditor();
});