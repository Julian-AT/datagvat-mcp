export function getSection(path: string | undefined) {
  if (!path) {
    return 'framework';
  }
  const [dir] = path.split('/', 1);
  if (!dir) {
    return 'framework';
  }
  return (
    {
      docs: 'docs',
      'api-reference': 'api-reference',
    }[dir] ?? 'docs'
  );
}
