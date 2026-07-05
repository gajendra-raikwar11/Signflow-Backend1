const docusign = require("docusign-esign");

const dsApiClient = new docusign.ApiClient();
dsApiClient.setOAuthBasePath("account-d.docusign.com");

const SCOPES = ["signature", "impersonation"];

async function getAuthenticatedClient() {
  let privateKey = process.env.DOCUSIGN_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("DOCUSIGN_PRIVATE_KEY is missing.");
  }

  // Safe for both multiline keys and \n formatted keys
  privateKey = privateKey.replace(/\\n/g, "\n");

  const results = await dsApiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    SCOPES,
    privateKey,
    3600
  );

  const accessToken = results.body.access_token;

  dsApiClient.addDefaultHeader(
    "Authorization",
    `Bearer ${accessToken}`
  );

  const userInfo = await dsApiClient.getUserInfo(accessToken);

  const account =
    userInfo.accounts.find(
      (acc) => acc.accountId === process.env.DOCUSIGN_ACCOUNT_ID
    ) || userInfo.accounts[0];

  dsApiClient.setBasePath(`${account.baseUri}/restapi`);

  return {
    apiClient: dsApiClient,
    accountId: account.accountId,
    baseUri: `${account.baseUri}/restapi`,
    accessToken,
  };
}

module.exports = { getAuthenticatedClient };