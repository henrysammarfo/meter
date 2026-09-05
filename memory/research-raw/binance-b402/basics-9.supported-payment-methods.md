# Supported payment methods

### Payment methods

B402 supports three payment methods based on EIP-712 off-chain authorization:

| **Method**    | **Description**                                                        | **Token Support** |
| ------------- | ---------------------------------------------------------------------- | ----------------- |
| eip3009       | EIP-3009 native `transferWithAuthorization`. No prior approval needed. | U and USD1 only   |
| permit2-exact | Permit2 exact-amount transfer. Transfers the precise amount specified. | Any ERC-20        |
| permit2-upto  | Permit2 up-to-amount transfer. Authorizes up to a maximum amount.      | Any ERC-20        |

> \*_For `permit2-exact` and `permit2-upto`, the buyer must complete a one-time token approval to
> the [Permit2 contract](https://github.com/Uniswap/permit2) before the first payment. This approval
> only needs to be done once per token._

### Supported networks

| **Network**             | **CAIP-2 Identifier** | **Chain ID** | **Status**               |
| ----------------------- | --------------------- | ------------ | ------------------------ |
| BNB Smart Chain Mainnet | eip155:56             | 56           | Live (access on request) |
| BNB Smart Chain Testnet | eip155:97             | 97           | Live                     |

### Supported tokens

#### Mainnet (`eip155:56`)

| **Token** | **Contract Address**                         | **Decimals** |
| --------- | -------------------------------------------- | ------------ |
| U         | `0xcE24439F2D9C6a2289F741120FE202248B666666` | 18           |
| USD1      | `0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d` | 18           |
| USDC      | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 18           |
| USDT      | `0x55d398326f99059fF775485246999027B3197955` | 18           |

> **Note on amount encoding:** All `paymentRequirements.amount` values are atomic units (smallest
> indivisible token unit), so for an 18-decimal token, $0.01 = `10000000000000000` (1e16), not
> `10000`. Verify against the contract's on-chain `decimals()` if in doubt — that's the source of
> truth.

#### Testnet (`eip155:97`)

| **Token** | **Contract Address**                         | **Decimals** | **Supported Methods**                      | **How to Obtain**                             |
| --------- | -------------------------------------------- | ------------ | ------------------------------------------ | --------------------------------------------- |
| Mock U    | `0x330949Aed7d00FCe0558C64ED6FeC9792616cC39` | 6            | `eip3009`, `permit2-exact`, `permit2-upto` | Mint from token contract directly by yourself |
| USDC      | `0xEC1C60D64a06896Df296438c12edD14E974FDE47` | 6            | `permit2-exact`, `permit2-upto`            | Mint from BnbChain faucet                     |
| USDT      | `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` | 18           | `permit2-exact`, `permit2-upto`            | Mint from BnbChain faucet                     |

### Key contract addresses

| **Contract** | **Network** | **Address**                                  |
| ------------ | ----------- | -------------------------------------------- |
| Permit2      | BSC Mainnet | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Permit2      | BSC Testnet | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

### Permit2 buyer prerequisites

Before using `permit2-exact` or `permit2-upto` payment methods, the buyer (payer) must:

1. **Approve the Permit2 contract** — Call the token's `approve()` function to grant the Permit2
   contract an allowance. This is a standard ERC-20 approval and only needs to be done once per
   token.
2. **Sign EIP-712 authorization** — For each payment, the buyer signs an off-chain EIP-712 message.
   No additional on-chain transaction is required from the buyer.

For `eip3009` (U, USD1), no prior approval is needed — these tokens natively support
`transferWithAuthorization`.
