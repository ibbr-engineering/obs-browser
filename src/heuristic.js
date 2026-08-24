const SEGMENT_RULES = [
  [/^[0-9a-f]{24}$/i, ':id'],
  [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ':uuid'],
  [/^\d{4}-\d{2}-\d{2}$/, ':date'],
  [/^\d+$/, ':n'],
  [/^[A-Za-z0-9_-]{40,}$/, ':token'],
];

export function heuristic(path) {
  const pathname = path.split(/[?#]/, 1)[0];
  return (
    pathname
      .split('/')
      .map((segment) => {
        if (segment === '') return segment;
        for (const [re, replacement] of SEGMENT_RULES) {
          if (re.test(segment)) return replacement;
        }
        return segment;
      })
      .join('/') || '/'
  );
}
