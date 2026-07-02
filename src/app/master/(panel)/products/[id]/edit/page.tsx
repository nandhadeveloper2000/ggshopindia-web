import EditProductClient from "./edit-product-client";

// Required for `output: export`: the export build needs at least one param, so
// we emit a single placeholder shell. Real product IDs are dynamic and render
// client-side (read via useParams); deep links rely on SPA fallback.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <EditProductClient />;
}
