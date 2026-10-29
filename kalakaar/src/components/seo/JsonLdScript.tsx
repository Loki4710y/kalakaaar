/** Renders ready-made structured data. `<` is escaped so content can never close the script tag. */
export function JsonLdScript({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
