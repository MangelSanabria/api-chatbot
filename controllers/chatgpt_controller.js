const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function new_query(req, res) {
  try {
    const { messages } = req.body;
    console.log(messages);
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content":
            "You are Falky helpful assistant Falkensteiner hotels and residences virtual agent",
        },
        ...messages,
      ],
    });
    res.status(200).json({
      completion: completion.data.choices[0].message,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports.new_query = new_query;
