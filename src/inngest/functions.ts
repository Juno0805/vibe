import { openai, createAgent } from "@inngest/agent-kit"; // can also import anthropic if I wanna use it

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {

    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer.  You write readable, maintainable code. You write in simple Next.js & React snippets.",
      model: openai({ model: "gpt-4o" }), // can change the openai() and model to other AI, like anthropic
    });

    const { output } = await codeAgent.run(
      `Write the following snippets: ${event.data.value}`,
    );

    console.log(output);

    return { output};
  },
);