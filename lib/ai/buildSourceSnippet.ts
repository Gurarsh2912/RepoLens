type BuildSourceSnippetOptions = {
  maxLines?: number;
  maxChars?: number;
  importantLines?: number[];
  contextRadius?: number;
};

export function buildSourceSnippet(
  code: string,
  options: BuildSourceSnippetOptions = {}
): string {
  const {
    maxLines = 80,
    maxChars = 6000,
    importantLines = [],
    contextRadius = 12,
  } = options;

  const lines = code.split("\n");

  // If no issue/important lines are supplied,
  // fall back to the beginning of the file.
  if (importantLines.length === 0) {
    const fallback = lines
      .slice(0, maxLines)
      .join("\n");

    return fallback.slice(0, maxChars);
  }

  const selectedIndexes = new Set<number>();

  for (const lineNumber of importantLines) {
    // issue lines are 1-based, arrays are 0-based
    const center = lineNumber - 1;

    const start = Math.max(
      0,
      center - contextRadius
    );

    const end = Math.min(
      lines.length - 1,
      center + contextRadius
    );

    for (let i = start; i <= end; i++) {
      selectedIndexes.add(i);
    }
  }

  const sortedIndexes = Array.from(
    selectedIndexes
  ).sort((a, b) => a - b);

  const limitedIndexes =
  sortedIndexes.slice(0, maxLines);

  const snippetLines: string[] = [];

  for (let i = 0; i < limitedIndexes.length; i++) {
    const currentIndex = limitedIndexes[i];

    if (i > 0) {
      const previousIndex =
        limitedIndexes[i - 1];

      if (
        currentIndex >
        previousIndex + 1
      ) {
        snippetLines.push("...");
      }
    }

    const lineNumber =
      currentIndex + 1;

    snippetLines.push(
      `${lineNumber}: ${lines[currentIndex]}`
    );
  }

  const snippet =
    snippetLines.join("\n");

  return snippet.slice(
    0,
    maxChars
  );
}