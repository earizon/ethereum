- Ethers.js: (Recomended by MetaMask for new WebApps)  [[{security.101]]
  - 2018:

  - Looks to be more "proffesional".  C&P from:
    https://docs.ethers.io/v5/api/providers/
     The default provider is the safest, easiest way to begin developing
     on Ethereum, and it is also robust enough for use in production.

     It creates a FallbackProvider connected to as many backend services
     as possible. When a request is made, it is sent to multiple backends
     simultaneously. As responses from each backend are returned, they are
     checked that they agree. Once a quorum has been reached (i.e. enough
     of the backends agree), the response is provided to your application.

     This ensures that if a backend has become out-of-sync, or if it has
     been compromised that its responses are dropped in favor of responses
     that match the majority.
  [[}]]
  - JS + TypeScript
  - small, compact library.
  - "Simple" and "intuitive".
  - large number of test cases.
  - Good "Getting Started" documentation.
  - current (2020-06) ver.:  5.0.3.
  - MIT License.
  - Modules:
    - Ethers.provider
      - abstract connection to node/network.
      - sending signed TXs ("writes") and read-queries.
        - ethers.providers.InfuraProvider:  Infura "client"
        - ethers.provider.getBalance
        - ethers.provider.resolve ← resolve ENS to address

  - Ethers.contract
    - deploy S.C.
    - listen for events emitted
    - call functions
    - get S.C. information
    - Ex:
      - ethers.ContractFactory.fromSolidity:
        Creates "factory" for deployment of S.C. using
        as input:
        - Solc output or
        - Truffle generated JSON file
      - ethers.Contract : ← interact with deployed S.C.
  - Ethers.utils
    - formatting data , process user inputs.
    - Ex:
      - ethers.utils.getContractAddress: Address from deployment TX
      - ethers.utils.computeAddress    : pub/priv: key to address
      - ethers.utils.formatEther       : Wei s to decimal string
  - Ethers.wallets
    - connect to existing wallet, create new one, sign TXs.
    - Ex:
      - ethers.wallet.createRandom
      - ethers.wallet.sign
      -  ethers.wallet.getBalance
    - Equivalent to web3.eth.accounts, but in web3js doc it
      warns: "This package has NOT been audited and might
      potentially be unsafe. Take precautions to clear memory
      properly, store the private keys safely, and test TX
      receiving/sending properly before using in production!"

  Comparative in STATs:
              starts|Used by|Maintainers|Test   |Size |Unpacked
                    |(repos)|           |support|     |
  -   Web3.js:~8,800|51.300 |3 of 12    |       |     |10.6MB
  - ethers.js:~1,500|18.500 |1(Richard  |"WINS" |284kb| 3.5MB
                               Moore)
  - ethers.js has surpassed web3.js in weekly downloads (even if its younger)

  Documentation:
  -   Web3.js: extensive API ref, Short "Getting Started"
  - Ethers.js: extensive API ref, Good “Getting Started”  ← Winner 
[[}]]
[[dev_framework.js.web3_js}]]

