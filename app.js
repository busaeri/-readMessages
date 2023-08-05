const createGmailAPI = require("./src/api");

const indexToUse = 1; // Set account from index

const gmailAPIInstance = createGmailAPI(indexToUse);

gmailAPIInstance
  .readInboxContent(
    "info@lyra.finance", //from
    "Please verify your email address"
  )
  .then((content) => {
    console.log(content);
    // regex content
    const regex = /https:\/\/click\.pstmrk\.it\/[^"]*2Fconfirm[^"]*/;
    const match = content.match(regex);
    if (match) {
      const url = match[0];
      console.log(url);
    }
  })
  .catch((error) => {
    console.error(error);
  });
