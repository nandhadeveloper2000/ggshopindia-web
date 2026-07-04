import { Suspense } from "react";
import CategoryBrandsClient from "./category-brands-client";

// Static route (no dynamic segment) so it is compatible with `output: export`.
// The category id + name are read from the query string on the client, which
// works on direct load, refresh, and the S3-hosted static build alike.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoryBrandsClient />
    </Suspense>
  );
}
