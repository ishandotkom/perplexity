import express, { text } from "express";
import cors from "cors";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { authMiddleware } from "./middleware";
import { prisma } from "./db";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const app = express();
app.use(express.json());
app.use(cors());

//Past conversation get
app.get('/conversations', authMiddleware, async(req, res)=>{
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(conversations);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
})

//Past conversation get
app.get('/conversation/:conversationId', authMiddleware, async(req, res)=>{
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.conversationId, userId: req.userId },
      include: {
        messages: {
          orderBy: { id: 'asc' }
        }
      }
    });
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json(conversation);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
})

//Ask
app.post("/perplexity_ask", authMiddleware, async (req, res) => {
  try {
    //step-1 - get the query from the user
    const query = req.body.query;

    //step-2 - create conversation in db with first user message
    const conversation = await prisma.conversation.create({
      data: {
        title: query.length > 50 ? query.substring(0, 50) + '...' : query,
        slug: query.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
        userId: req.userId as string,
        messages: {
          create: {
            role: "USER",
            content: query
          }
        }
      }
    });

    // Provide conversation ID to frontend via custom header
    res.setHeader("x-conversation-id", conversation.id);

    //step-4 - web search to gather sources
    const webSearchResponse = await client.search(query, {
      searchDepth: "advanced",
    });

    const webSearchResult = webSearchResponse.results;

    //step-5 -  do some context engineering on the prompt + web search responses
    const prompt = PROMPT_TEMPLATE.replace(
      "{{web_search_results}}",
      JSON.stringify(webSearchResult),
    ).replace("{{user_query}}", query);

    //step-6 - hit the llm with the engineered prompt and stream back response to client
    const ai = new GoogleGenAI({ apiKey: process.env.AI_GATEWAY_API });

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullAiResponse = "";

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAiResponse += chunk.text;
        res.write(chunk.text);
      }
    }
    res.write("\n<SOURCES>\n");
    //step-7 - also stream back the resources and the follow up questions
    res.write(
      JSON.stringify(webSearchResult.map((result) => ({ url: result.url }))),
    );
    res.write("\n</SOURCES>\n");

    // Save AI response to DB
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "AI",
        content: fullAiResponse
      }
    });

    //step-8 - close the event stream
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.end();
    }
  }
});

app.post('/perplexity_ask/follow_up', authMiddleware, async(req,res)=> {
  try {
    const { query, conversationId } = req.body;

    //Step 1- get the existing chat from the db
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.userId },
      include: { messages: { orderBy: { id: 'asc' } } }
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save new user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: query
      }
    });

    //Step 2- Forward the full history to the llm
    const chatHistory = conversation.messages.map(m => `${m.role}: ${m.content}`).join("\n\n");

    const webSearchResponse = await client.search(query, {
      searchDepth: "advanced",
    });
    const webSearchResult = webSearchResponse.results;

    //Step 2.5- Do context engineering here
    let prompt = PROMPT_TEMPLATE.replace(
      "{{web_search_results}}",
      JSON.stringify(webSearchResult),
    ).replace("{{user_query}}", query);
    
    prompt = `Previous Chat History:\n${chatHistory}\n\n` + prompt;

    const ai = new GoogleGenAI({ apiKey: process.env.AI_GATEWAY_API });

    //Step 3- Stream the response back to the user
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullAiResponse = "";
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAiResponse += chunk.text;
        res.write(chunk.text);
      }
    }
    res.write("\n<SOURCES>\n");
    res.write(
      JSON.stringify(webSearchResult.map((result) => ({ url: result.url }))),
    );
    res.write("\n</SOURCES>\n");

    // Save AI response to DB
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "AI",
        content: fullAiResponse
      }
    });

    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.end();
    }
  }
})

app.listen(3001);
