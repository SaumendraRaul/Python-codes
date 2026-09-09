export type Snippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SnippetInput = Pick<Snippet, "title" | "language" | "code" | "notes" | "tags"> & {
  id?: string;
};
