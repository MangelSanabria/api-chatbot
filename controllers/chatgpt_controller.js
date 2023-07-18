const fs = require("fs");
const { openai } = require("../utils/helper");
let embeddedPath = "./embeddedData/embeddedFile.txt";

// Config variables
let embeddingStore = {};
const embeds_storage_prefix = "embeds:";
let embeddedQuestion;

const createPrompt = (prompt, paragraph) => {
  return (
    prompt +
    "Answer the following questions, also use your own knowledge when necessary :\n\n" +
    "Context :\n" +
    paragraph.join("\n\n") +
    "\n\nAnswer :"
  );
};

// Removes the prefix from paragraph
const keyExtractParagraph = (key) => {
  return key.substring(embeds_storage_prefix.length);
};

// Calculates the similarity score of question and context paragraphs
const compareEmbeddings = (embedding1, embedding2) => {
  var length = Math.min(embedding1.length, embedding2.length);
  var dotprod = 0;

  for (var i = 0; i < length; i++) {
    dotprod += embedding1[i] * embedding2[i];
  }

  return dotprod;
};

// Loop through each context paragraph, calculates the score, sort using score and return top count(int) paragraphs
const findClosestParagraphs = (questionEmbedding, count) => {
  var items = [];

  for (const key in embeddingStore) {
    let paragraph = keyExtractParagraph(key);

    let currentEmbedding = JSON.parse(embeddingStore[key]).embedding;

    items.push({
      paragraph: paragraph,
      score: compareEmbeddings(questionEmbedding, currentEmbedding),
    });
  }

  items.sort(function (a, b) {
    return b.score - a.score;
  });

  return items.slice(0, count).map((item) => item.paragraph);
};

const new_query = async (req, res) => {
  try {
    const { messages } = req.body;
    console.log(messages);

    // Retrieve embedding store and parse it
    let embeddingStoreJSON = fs.readFileSync(embeddedPath, {
      encoding: "utf-8",
      flag: "r",
    });

    embeddingStore = JSON.parse(embeddingStoreJSON);

    // Embed the prompt using embedding model
    let content = messages[messages.length - 1].content;

    let embeddedQuestionResponse = await openai.createEmbedding({
      input: content,
      model: "text-embedding-ada-002",
    });

    // Some error handling
    if (embeddedQuestionResponse.data.data.length) {
      embeddedQuestion = embeddedQuestionResponse.data.data[0].embedding;
    } else {
      throw Error("Question not embedded properly");
    }

    // Find the closest count(int) paragraphs
    let closestParagraphs = findClosestParagraphs(embeddedQuestion, 5);
    const prompt =
      "You are Falky helpful assistant Falkensteiner hotels and residences virtual agent, answer in max 3 sentences";

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": createPrompt(
            prompt,
            closestParagraphs,
          ),
        },
        ...messages,
      ],
    });
    console.log(completion.data.choices[0].message)
    res.status(200).json({
      completion: completion.data.choices[0].message,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.new_query = new_query;
