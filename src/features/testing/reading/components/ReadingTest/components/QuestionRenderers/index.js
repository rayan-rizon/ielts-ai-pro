// Barrel export for question renderer components
// These are designed to be lazily loaded for better code splitting

export { default as TableCompletionRenderer } from './TableCompletionRenderer';
export { default as NotesCompletionRenderer } from './NotesCompletionRenderer';
export { default as FlowchartRenderer } from './FlowchartRenderer';

// Default exports for lazy loading
// Usage: const TableCompletionRenderer = React.lazy(() => import('./QuestionRenderers/TableCompletionRenderer'))
