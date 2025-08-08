import { HydrationBoundary, dehydrate, useQuery } from "@tanstack/react-query";

import { trpc, getQueryClient} from "@/trpc/server"

import { Client } from "./client";

import { Suspense } from "react";

const Page = async () => {
  // const data = await caller.createAI({ text: "Juno SERVER" });

  const queryClient = getQueryClient();
    void queryClient.prefetchQuery(trpc.createAI.queryOptions({text: "Juno Prefetch"}))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p>Loading...</p>}>
        <Client />
      </Suspense>
    </HydrationBoundary>
  );
}

export default Page;