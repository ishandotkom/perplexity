import express from 'express';

const app = express();

app.post('/conversation', async(req, res) =>{
    //step-1 - get the query from the user 

    //step-2 - make sure user has access/credits to hit the endpoint

    //step-3 - check if we have web search indexed for similar queries

    //step-4 - web search to gather resources

    //step-5 -  do some context engineering on the prompt + web search responses

    //step-6 - hit the llm with the engineered prompt and stream back response to client

    //step-7 - also stream back the resources and the follow up questions 
    //we can get from another llm call

    //step-8 - close the event stream

})

app.listen(3000);