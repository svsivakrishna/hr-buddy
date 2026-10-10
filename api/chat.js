const { v2beta1 } = require('@google-cloud/dialogflow');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Please use POST.' });
  }
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const projectId = creds.project_id;
    const client = new v2beta1.SessionsClient({
      projectId,
      credentials: { client_email: creds.client_email, private_key: creds.private_key },
    });

    const { message, sessionId } = req.body || {};
    const session = client.projectAgentSessionPath(projectId, sessionId || 'web-user');
    const request = {
      session,
      queryInput: { text: { text: message || 'hello', languageCode: 'en' } },
    };

    // Optional: lets the Knowledge Base answer too
    const kb = process.env.KNOWLEDGE_BASE_ID;
    if (kb) {
      request.queryParams = {
        knowledgeBaseNames: [`projects/${projectId}/knowledgeBases/${kb}`],
      };
    }

    const [response] = await client.detectIntent(request);
    const qr = response.queryResult;
    let reply = qr.fulfillmentText;
    if (!reply && qr.knowledgeAnswers && qr.knowledgeAnswers.answers && qr.knowledgeAnswers.answers.length) {
      reply = qr.knowledgeAnswers.answers[0].answer;
    }
    res.status(200).json({ reply: reply || "Sorry, I didn't get that." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ reply: 'Sorry, HR Buddy is unavailable right now.' });
  }
};
