const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const path = require("path");

class GmailAPI {
  constructor(index) {
    this.credentials = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./credentials.json"))
    )[index];
    this.accessToken = "";
  }

  async getAccessToken() {
    const data = {
      client_id: this.credentials.web.client_id,
      client_secret: this.credentials.web.client_secret,
      refresh_token: this.credentials.web.refresh_token,
      grant_type: "refresh_token",
    };

    const config = {
      method: "post",
      url: "https://accounts.google.com/o/oauth2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: qs.stringify(data),
    };

    const response = await axios(config);
    const accessToken = response.data.access_token;

    // console.log(`Access Token ${accessToken}`);

    return accessToken;
  }

  async searchGmail(sender, subject) {
    const config = {
      method: "get",
      url: `https://www.googleapis.com/gmail/v1/users/me/messages?q=from%3A${sender}+subject%3A"${subject}"`,
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
    };

    const response = await axios(config);

    if (
      !Array.isArray(response.data.messages) ||
      response.data.messages.length === 0
    ) {
      throw new Error("No matching messages found");
    }

    const threadId = response.data.messages[0].id;

    console.log(`ThreadId = ${threadId}`);

    return threadId;
  }
  async readGmailContent(messageId) {
    const config = {
      method: "get",
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
    };

    const response = await axios(config);
    const data = response.data;

    return data;
  }

  async readInboxContent(sender, subject) {
    let threadId = "";
    let data = {};
    let attempts = 0;

    do {
      try {
        threadId = await this.searchGmail(sender, subject);
        data = await this.readGmailContent(threadId);
      } catch (error) {
        attempts++;
        console.log(
          `Failed to read Gmail content, retrying... (${attempts} attempts)`
        );
      }
    } while (Object.keys(data).length === 0 && attempts < 3);

    if (Object.keys(data).length === 0) {
      throw new Error("Failed to read Gmail content");
    }

    const parts = data.payload.parts;
    let body = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.mimeType === "text/html") {
        body = part.body.data;
        break;
      }
    }

    const decodedStr = Buffer.from(body, "base64").toString("utf-8");
    return decodedStr;
  }
}
function createGmailAPI(index) {
  return new GmailAPI(index);
}

module.exports = createGmailAPI;
