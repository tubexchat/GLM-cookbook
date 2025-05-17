// Example usage of the GLM-4 client
const GLM4Client = require('./glm4-client');
// 加载.env文件中的环境变量
require('dotenv').config();

async function runExamples() {
  // Make sure ZHIPU_API_KEY is set in the environment
  if (!process.env.ZHIPU_API_KEY) {
    console.error('Please set the ZHIPU_API_KEY environment variable');
    console.error('Example: ZHIPU_API_KEY=your_api_key node example.js');
    console.error('或者在.env文件中设置ZHIPU_API_KEY');
    process.exit(1);
  }

  const client = new GLM4Client();
  
  console.log('Example 1: Basic conversation');
  try {
    const response = await client.chat([
      { role: 'user', content: '你能做什么？' }
    ]);
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error in basic conversation:', error);
  }

  console.log('\nExample 2: Multi-turn conversation');
  try {
    const response = await client.chat([
      { role: 'user', content: '你好，我想了解一下人工智能的发展历史' },
      { role: 'assistant', content: '人工智能的发展历史可以追溯到20世纪50年代。1956年，在达特茅斯会议上，"人工智能"这一术语首次被约翰·麦卡锡提出。从那时起，人工智能经历了几次起伏...' },
      { role: 'user', content: '请具体介绍一下深度学习的突破' }
    ]);
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error in multi-turn conversation:', error.message);
    if (error.response && error.response.data) {
      console.error('API返回错误:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\nExample 3: Streaming response');
  try {
    console.log('Streaming response (content will appear word by word):');
    let content = '';
    
    await client.streamChat(
      [{ role: 'user', content: '用中文写一个短故事，主题是"人工智能与人类的友谊"' }],
      (data, done) => {
        if (done) {
          console.log('\n\n流式响应结束');
          // 输出完整的响应内容
          console.log('\n完整内容:\n' + content);
        } else if (data) {
          // 确保data有效并包含必要的属性
          const chunk = data.choices && data.choices[0] && data.choices[0].delta
            ? data.choices[0].delta.content || ''
            : '';
          
          if (chunk) {
            content += chunk;
            process.stdout.write(chunk);
          }
        }
      },
      { temperature: 0.8, max_tokens: 800 }
    );
  } catch (error) {
    console.error('Error in streaming response:', error.message);
    if (error.response && error.response.data) {
      console.error('API返回错误:', error.response.data);
    }
  }
}

runExamples().catch(error => {
  console.error('顶层异常捕获:', error.message);
}); 