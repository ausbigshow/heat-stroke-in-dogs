/**
 * Visual Edit Mode Module
 * Bundles all editor managers and initializes the development visual authoring layer.
 */

import { EditorState } from './editor-state.js';
import { SelectionManager } from './selection-manager.js';
import { DragManager } from './drag-manager.js';
import { ResizeManager } from './resize-manager.js';
import { TextEditor } from './text-editor.js';
import { HistoryManager } from './history-manager.js';
import { SaveManager } from './save-manager.js';
import { VersionManager } from './version-manager.js';
import { EditorToolbar } from './editor-toolbar.js';

export function initEditMode() {
  const state = new EditorState();
  const history = new HistoryManager(state);
  const selection = new SelectionManager(state, history);
  const drag = new DragManager(state, selection, history);
  const resize = new ResizeManager(state, selection, history);
  const textEditor = new TextEditor(state, selection, history);
  const save = new SaveManager(state, selection);
  const version = new VersionManager(state, save);
  const toolbar = new EditorToolbar(state, selection, history, save, version);

  console.log('🛠️ Visual Edit Mode Initialized. Press Ctrl+Shift+E (or Cmd+Shift+E) to toggle.');

  return {
    state,
    selection,
    drag,
    resize,
    textEditor,
    history,
    save,
    version,
    toolbar
  };
}
