# How to apply partner developer account

> **Important:** Sandbox (Testnet) and Production use **separate** developer accounts. You must
> apply independently for each environment. Credentials (`clientId`, `accessToken`, RSA key pairs,
> IP whitelists) are **not shared** between environments.

If you are a partner (client) who wants to integrate B402's Open API, please
**[submit an application](https://forms.gle/aUQvxUETfGMzyTky5)** and provide the following items
**per environment**:

- **Business name** — your business or brand name;
- **Email** — primary contact email address;
- **Wallet address** — an EVM-compatible wallet address (0x...) to receive funds (testnet address
  for Sandbox, mainnet address for Production);
- [Public key](3.request-signing.md) for API requests (private key kept by the partner/client
  safely);
- IP addresses used to configure whitelist;
- Webhook callback URL (if applicable).

Once the configuration is completed, the following items will be provided **for each environment
separately**:

- Client id (`clientId`);
- Sign access token (`accessToken`);
- Public key for webhook verification (private key kept safely).

Then the partner (client) will be able to call all Open APIs for that environment.

> **It is recommended to start with the Sandbox (Testnet) environment first.** Once integration
> testing is completed, apply for Production credentials and switch to the Production environment
> for go-live. Refer to "[Environments and API base URLs](4.base-urls.md)" for base URLs.
