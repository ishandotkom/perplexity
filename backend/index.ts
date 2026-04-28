import express, { text } from "express";
import cors from "cors";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { authMiddleware } from "./middleware";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const app = express();
app.use(express.json());
app.use(cors());

//Past conversation get
app.get('/conversations', authMiddleware, async(req, res)=>{
  res.json({
    userId: req.userId,
  })

})

//Past conversation get
app.get('/conversation/:conversationId', authMiddleware, async(req, res)=>{

})

//Ask
app.post("/perplexity_ask", authMiddleware, async (req, res) => {
  //step-1 - get the query from the user
  const query = req.body.query;

  //step-2 - make sure user has access/credits to hit the endpoint

  //step-3 - check if we have web search indexed for similar queries

  //step-4 - web search to gather sources
  const webSearchResponse = await client.search(query, {
    searchDepth: "advanced",
  });

  const webSearchResult = webSearchResponse.results;

  //step-5 -  do some context engineering on the prompt + web search responses

  //step-6 - hit the llm with the engineered prompt and stream back response to client

  const prompt = PROMPT_TEMPLATE.replace(
    "{{web_search_results}}",
    JSON.stringify(webSearchResult),
  ).replace("{{user_query}}", query);

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
  for await (const chunk of responseStream) {
    if (chunk.text) {
      res.write(chunk.text);
    }
  }
  res.write("\n<SOURCES>\n");
  //step-7 - also stream back the resources and the follow up questions(which we can get from another parallell llm call)
  res.write(
    JSON.stringify(webSearchResult.map((result) => ({ url: result.url }))),
  );
  res.write("\n</SOURCES>\n");

  //step-8 - close the event stream

  res.end();
});

app.post('/perplexity_ask/follow_up', authMiddleware, async(req,res)=> {
  //Step 1- get the existing chat from the db,
  //Step 2- Forward the full history to the llm
  //Step 2.5- TODO: - Do context engineering here
  //Step 3- Stream the response back to the user
})

app.listen(3001);
