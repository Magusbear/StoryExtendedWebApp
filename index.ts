import { Configuration, CreateCompletionResponse, OpenAIApi } from "openai";
import axios, { AxiosResponse } from 'axios';
let openai: OpenAIApi;

interface data {
    name: string;
    last_text: string;
    user_input: string;
    aiCharDescription: string;
    aiCharQuote: string;
    aiStaticPrompt: string;
  }
  interface Output {
    data: {
        id: string;
        object: string;
        created: number;
        model: string;
        choices: {
          text: string;
          index: number;
          logprobs: {
            tokens: string[];
            token_logprobs: number[];
            top_logprobs: number[];
            text_offset: number[];
          };
          finish_reason: string;
        }[];
      }[];
  }

export function setUpOpenAi(openAiApiKey: string){
  let configuration = new Configuration({
    apiKey: openAiApiKey,
  });
  
  delete configuration.baseOptions.headers['User-Agent'];
  
  openai = new OpenAIApi(configuration);
};

export async function queryAI(data:data): Promise<string> {
  let name = data.name;
  let description = data.aiCharDescription;
  let last_text = data.last_text;
  let user_input = data.user_input;
  let quote = data.aiCharQuote;
  let static_prompt = data.aiStaticPrompt;

  const prompt = static_prompt + " { name: " + name + " } " + " { description: " + description + " } " + " { Quote (dont repeat!): " + quote + " } " + " { Your_last_answer: " + last_text + " } " + " { question: " + user_input + " } ";

  const parameters = {
    model: "text-davinci-003",
    prompt,
    temperature: 0.5,
    max_tokens: 2000,
    n: 1,
  };

return new Promise((resolve, reject) => {
    openai.createCompletion(parameters)
      .then((response: AxiosResponse<CreateCompletionResponse>) => {
        const output: string = response.data.choices[0].text as string;
        resolve(output);
      })
      .catch((err: String) => {
        reject(err);
      });
  });
}


