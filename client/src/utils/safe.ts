export function safeArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v;

  // частые обёртки
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.rows)) return v.rows;
  if (Array.isArray(v?.users)) return v.users;
  if (Array.isArray(v?.surveys)) return v.surveys;
  if (Array.isArray(v?.templates)) return v.templates;

  return [];
}
