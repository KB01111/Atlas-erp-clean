/**
 * Mock LiteLLM class for Docker build
 */
export class LiteLLM {
  constructor(options: any = {}) {
    // Mock constructor
  }

  async completion(options: any = {}) {
    // Mock completion method
    return {
      choices: [
        {
          message: {
            content: "This is a mock response from LiteLLM",
          },
        },
      ],
    };
  }

  async embedding(options: any = {}) {
    // Mock embedding method
    return {
      data: [
        {
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
      ],
    };
  }
}
