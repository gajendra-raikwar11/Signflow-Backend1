const docusign = require("docusign-esign");
const fs = require("fs");
const path = require("path");

const dsApiClient = new docusign.ApiClient();
dsApiClient.setOAuthBasePath("account-d.docusign.com"); // demo/sandbox auth server

const SCOPES = ["signature", "impersonation"];

async function getAuthenticatedClient() {
const keyPath = path.resolve(__dirname, "../../../", process.env.DOCUSIGN_PRIVATE_KEY_PATH.trim());
const privateKey = fs.readFileSync(keyPath, "utf8");

  // Step 1: get JWT access token
  const results = await dsApiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    SCOPES,
    privateKey,
    3600 // token valid for 1 hour
  );

  const accessToken = results.body.access_token;
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  // Step 2: get real account-specific baseUri (don't hardcode it)
  const userInfo = await dsApiClient.getUserInfo(accessToken);
  const account = userInfo.accounts.find(
    (acc) => acc.accountId === process.env.DOCUSIGN_ACCOUNT_ID
  ) || userInfo.accounts[0];

  const baseUri = `${account.baseUri}/restapi`;
  dsApiClient.setBasePath(baseUri);

  return {
    apiClient: dsApiClient,
    accountId: account.accountId,
    baseUri,
    accessToken,
  };
}

module.exports = { getAuthenticatedClient };