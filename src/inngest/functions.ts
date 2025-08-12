import { Sandbox } from "@e2b/code-interpreter"
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { openai, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit"; // can also import anthropic if I wanna use it

import { PROMPT } from "@/prompts";
import { inngest } from "./client";
import { z } from "zod";
import { prisma } from "@/lib/db";

interface AgentState {
  summary: string;
  files: { [path: string]: string};
};

export const vibeCodingAgent = inngest.createFunction(
  { id: "vibe-coding-agenet" },
  { event: "vibe-coding-agenet/run" },
  async ({ event, step }) => {
    // Step 1: Create a sandbox environment and retrieve its ID
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-next-testing");
      return sandbox.sandboxId;
    });

    // Step 2: Create an AI "code agent" with specific tools and behavior
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ 
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1,  // Controls randomness to be low randomness, more focused and predictable output (range is from 0 - 1)
        }
      }), // can change the openai() and model to other AI, like anthropic
      tools: [
        // Tool 1: Run terminal commands inside the sandbox
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: ""};

              try {
               const sandbox = await getSandbox(sandboxId);
               const result = await sandbox.commands.run(command, {
                // It is important for us to know if the commands succeed or fail.
                // So, we have to keep track of it
                onStdout: (data: string) => {
                  buffers.stdout += data;
                },
                onStderr: (data: string) => {
                  buffers.stderr += data;
                }
               });
               return result.stdout;
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout ${buffers.stdout}\nstderror: ${buffers.stderr}`, 
                );
                return `Command failed: ${e} \nstdout ${buffers.stdout}\nstderror: ${buffers.stderr}`;
              }
            });
          },
        }),

        // Tool 2: Create or update files inside the sandbox
        createTool({
            name: "createOrUpdateFiles",
            description: "Create or update files in the sandbox",
            parameters: z.object({
              files: z.array(
                z.object({
                  path: z.string(),
                  content: z.string(),
                }),
              ),
            }),
            handler: async (
              { files },
              { step, network }: Tool.Options<AgentState>
            ) => {
              const newFiles = await step?.run("createOrUpdateFiles", async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content; // keep track of which files were changed, dont just rely on asking the AI since it has token limits
                  }
                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              });

              if (typeof newFiles === "object") {
                network.state.data.files = newFiles;
              }
            }
        }),

        // Tool 3: Read files from the sandbox
        createTool({
          name: "readFiles",
          description: "read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            })
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);

        if (lastAssistantMessageText && network) {
          if (lastAssistantMessageText.includes("<task_summary>")) {
            network.state.data.summary = lastAssistantMessageText;
          }
        }
        return result;
       },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15, // maximum iteration is 15 times. Stop the agent from thinking forever. Also, prevent that it use all of my open AI credits.
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {

      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      })
    });



    // Step 5: Return both the AI-generated output and sandbox URL
    return { 
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);