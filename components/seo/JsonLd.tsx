/**
 * Renders a schema.org structured-data block.
 *
 * Emits nothing visible — search engines read it to build rich results (article dates,
 * organization panel, breadcrumbs). Server-only, so it adds no client JavaScript.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify can emit a literal "</script>" inside string values (article titles come
      // from the database), which would terminate the block early. Escaping "<" prevents that.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
