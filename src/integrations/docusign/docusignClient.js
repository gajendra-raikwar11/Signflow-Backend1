const docusign = require("docusign-esign");
const { getPrivateKey } = require("../../config/docusign.config");

const dsApiClient = new docusign.ApiClient();
dsApiClient.setOAuthBasePath("account-d.docusign.com");

const SCOPES = ["signature", "impersonation"];

async function getAuthenticatedClient() {
  const privateKey = getPrivateKey();

  const results = await dsApiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    SCOPES,
    privateKey,
    3600
  );

  const accessToken = results.body.access_token;
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

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