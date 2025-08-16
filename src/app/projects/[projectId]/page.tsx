import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

interface Props {
    params: Promise<{
        projectId: string;
    }>
};

const Page = async ({ params }: Props) => {
    const { projectId } = await params;

    const qureyClient = getQueryClient();
    void qureyClient.prefetchQuery(trpc.messages.getMany.queryOptions({
        projectId,
    }));

    void qureyClient.prefetchQuery(trpc.projects.getOne.queryOptions({
        id: projectId,
    }));

    return (
        <HydrationBoundary state={dehydrate(qureyClient)}>
            <Suspense fallback={<p>Loading Project...</p>}>
                <ProjectView projectId={projectId} />
            </Suspense>
        </HydrationBoundary>
    );
}

export default Page;