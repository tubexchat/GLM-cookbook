// GLM-4 API Client for Zhipu AI
// Reference: https://www.bigmodel.cn/dev/api/normal-model/glm-4-flash-250414

const axios = require('axios');
const crypto = require('crypto');
// 加载.env文件中的环境变量
require('dotenv').config();

// Get API key from environment variable
const apiKey = process.env.ZHIPU_API_KEY;
if (!apiKey) {
  console.error('Error: ZHIPU_API_KEY environment variable is not set');
  process.exit(1);
}

// Parse the API key to get id and secret
const [id, secret] = apiKey.split('.');

// Generate JWT token for authentication
function generateToken() {
  const payload = {
    api_key: id,
    exp: Math.floor(Date.now() / 1000) + 3600, // Token expires in 1 hour
    timestamp: Math.floor(Date.now() / 1000)
  };

  const header = {
    alg: 'HS256',
    sign_type: 'SIGN'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// GLM-4 API client class
class GLM4Client {
  constructor() {
    this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/';
    this.token = generateToken();
  }

  async chat(messages, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}chat/completions`,
        {
          model: 'glm-4-flash-250414',
          messages,
          ...options
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error calling GLM-4 API:', error.response?.data || error.message);
      throw error;
    }
  }

  async streamChat(messages, callback, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}chat/completions`,
        {
          model: 'glm-4-flash-250414',
          messages,
          stream: true,
          ...options
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          responseType: 'stream'
        }
      );

      // 处理缓冲区中可能被截断的JSON数据
      let buffer = '';

      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        buffer += chunkStr;
        
        // 按行分割缓冲区内容，并保留最后一个不完整的行在缓冲区中
        const lines = buffer.split('\n');
        
        // 如果最后一行是空或不完整的，保留它在缓冲区
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue; // 跳过空行
          
          // 处理data:前缀的行
          if (line.includes('data:')) {
            try {
              const jsonData = line.replace('data:', '').trim();
              
              if (jsonData === '[DONE]') {
                callback(null, true); // 流结束信号
              } else {
                try {
                  const parsedData = JSON.parse(jsonData);
                  callback(parsedData, false);
                } catch (e) {
                  console.error('警告: JSON解析错误，跳过此数据块:', e.message);
                  console.debug('问题数据:', jsonData);
                  // 继续处理后续数据而不中断流
                }
              }
            } catch (error) {
              console.error('处理流数据行时出错:', error.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        // 流结束时检查缓冲区是否还有数据
        if (buffer.trim() && buffer.includes('data:')) {
          try {
            const jsonData = buffer.replace('data:', '').trim();
            if (jsonData !== '[DONE]') {
              try {
                const parsedData = JSON.parse(jsonData);
                callback(parsedData, false);
              } catch (e) {
                console.error('流结束时处理剩余数据出错:', e.message);
              }
            }
          } catch (error) {
            console.error('处理剩余流数据时出错:', error.message);
          }
        }
        
        // 确保发送结束信号
        callback(null, true);
      });

      response.data.on('error', (err) => {
        console.error('流数据接收出错:', err.message);
        callback(null, true); // 出错时也发送结束信号
      });

      return response;
    } catch (error) {
      console.error('Error in stream chat:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Example usage
async function example() {
  const client = new GLM4Client();
  
  // Example 1: Simple chat completion
  const result = await client.chat([
    { role: 'user', content: '你好，请介绍一下自己' }
  ]);
  console.log('Chat response:', result);
  
  // Example 2: Streaming chat completion
  await client.streamChat(
    [{ role: 'user', content: '写一首关于人工智能的诗' }],
    (data, done) => {
      if (done) {
        console.log('Stream completed');
      } else {
        console.log('Stream chunk:', data.choices[0]?.delta?.content || '');
      }
    },
    { temperature: 0.7 }
  );
}

// Run the example if this file is executed directly
if (require.main === module) {
  example().catch(console.error);
}

module.exports = GLM4Client; 