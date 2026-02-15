const WHITESPACE_RE = /\s+/;
const TRAILING_DOT_RE = /\.$/;

/**
 * Create transform stream to extract normalized domain
 *
 * - assumes whitespace-delimited zone file format
 * - skips if not NS record
 * - gets first column, strips trailing root-label dot
 * - skips adjacent duplicates
 */
export function createDomainExtractorStream(): TransformStream<string, string> {
  let lastDomain: string | undefined;

  return new TransformStream<string, string>({
    transform(line, controller) {
      const fields = line.trim().split(WHITESPACE_RE);

      if (fields.length < 4) {
        return;
      }

      const type = fields[3].toLowerCase();

      if (type !== "ns") {
        return;
      }

      const domain = fields[0];
      const normalized = domain.replace(TRAILING_DOT_RE, "");

      if (normalized === lastDomain) {
        return;
      }

      lastDomain = normalized;
      controller.enqueue(`${normalized}\n`);
    },
  });
}
