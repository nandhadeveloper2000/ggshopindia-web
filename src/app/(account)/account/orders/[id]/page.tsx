import OrderDetailsClient from "./order-details-client";

// Required for `output: export`: the export build needs at least one param, so
// we emit a single placeholder shell. Real order IDs are created at runtime and
// render client-side (read via useParams); deep links rely on SPA fallback.
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <OrderDetailsClient />;
}
