// Shapes mirroring scripts/build-catalog.mjs output (catalog.json).

export type Status = 'Active' | 'Deprecated' | 'Obsoleted' | 'Unregistered';
export type DocKind = 'pattern' | 'tooling';

export interface Param {
  id: string;
  default: string;
  label: string;
}

export interface Rule {
  id: string; // slug
  sid: string | null;
  status: Status;
  title: string;
  bodyMarkdown: string;
  params: Param[];
}

export interface Section {
  title: string;
  rules: Rule[];
}

export interface StandardFile {
  path: string;
  title: string;
  sections: Section[];
}

export interface StandardDoc {
  kind: DocKind;
  id: string; // slug
  sid: string | null;
  status: Status;
  path: string;
  title: string;
  bodyMarkdown: string;
}

export interface Standard {
  id: 'api' | 'code';
  title: string;
  dir: string; // source directory name, e.g. "code-standards"
  license: string | null;
  files: StandardFile[];
  documents: StandardDoc[];
}

export interface Catalog {
  standards: Standard[];
}

/** A flattened, selectable unit — a rule or a whole document. */
export interface Unit {
  key: string; // stable selection key, e.g. "code:rule:test-fast" or "code:pattern:webhooks"
  kind: 'rule' | DocKind;
  standardId: 'api' | 'code';
  standardTitle: string;
  filePath: string; // source path within the standard
  fileTitle: string;
  section: string; // '' for documents
  id: string; // slug
  sid: string | null;
  status: Status;
  title: string;
  bodyMarkdown: string;
  params: Param[];
}
