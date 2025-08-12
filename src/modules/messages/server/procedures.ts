import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { inngest } from "@/inngest/client";

export const messagesRouter = createTRPCRouter({
    getMany: baseProcedure
        .query(async () => {
            const messages = await prisma.message.findMany({
                orderBy: {
                    updatedAt: "desc"
                },
            });

            return messages;
        }),
    create: baseProcedure
        .input(
            z.object({
                value: z.string().min(1, { message: "Message is required" }),
            })
        )
        .mutation(async ({ input }) => {
            const createMessage = await prisma.message.create({
                data: {
                    content: input.value,
                    role: "USER",
                    type: "RESULT",
                },
            });

        await inngest.send({
            name: "vibe-coding-agenet/run",
            data: {
              value: input.value,
            }
        });

        return createMessage;
    }),
});