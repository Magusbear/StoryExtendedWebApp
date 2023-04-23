declare module './index.js' {
    type InputData = {
      name: string;
      last_text: string;
      user_input: string;
      aiCharDescription: string;
      aiCharQuote: string;
      aiStaticPrompt: string;
    }
  
    export function queryAI(input: InputData): Promise<string>;
  }