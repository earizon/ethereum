[[{standards.eea,consensus.eea,privacy.private_tx]]
## EEA TX Manager
- Quorum’s Transaction Manager is responsible for Transaction privacy.
   It stores and allows access to encrypted transaction data, exchanges encrypted
   payloads with other participant's Transaction Managers but does not have
   access to any sensitive private keys. It utilizes the Enclave for
   cryptographic functionality (although the Enclave can optionally be
   hosted by the Transaction Manager itself.)

- """To send a private transaction, a PrivateTransactionManager must be
   configured. This is the service which transfers private payloads to
   their intended recipients, performing encryption and related operations
   in the process."""
- The Transaction Manager is restful/stateless and can be load balanced easily.

<a href='https://github.com/jpmorganchase/quorum/wiki/Transaction-Processing'>Transaction Processing</a>
  - 'Public Transactions' and 'Private Transactions' are a notional concept
    only and Quorum does not introduce new Transaction Types, but rather, the
    Ethereum Transaction Model has been extended to include an optional
    '  privateFo  ' parameter (the population of which results in a Transaction
    being treated as private by Quorum) and the Transaction Type has a new
    IsPrivate method to identify such Transactions.
  -   privateFo   can take multiple addresses in a comma separated list.
  - Private Transactions payload is only visible to the network
    participants specified in the   privateFo   parameter of the TX.
  - Quorum Node sets the Transaction_Signature.V = 37 or 38
    (as opposed to 27 or 28)

  - prior to propagate the TX to the rest of the network,
    mining/sender node replaces the original TX-Payload with
    a the hash of the encrypted Payload that received from the
    secure enclave implementation (Crux, Constellation,..).
    Participants involved in the   privateFo   TX
    will have the encrypted payload associated to the hash
    within their secure enclave.

  Example priv.TX A←→B:<span bgorange>
Party A and B belongs to TX AB, whilst C doesn't
Party A → A.Node: TX + payload
                TX.  privateFo   [ pub.key A, pub.keyB]
A.Node → A TX Manager: Request to store TX payload
A_TX_Manager → Enclave: - Validate sender with A priv.key

Enclave → Enclave:  performs TX conversion (encrypt payload)
                    - generating [sym.key, random Nonce]
                    - encrypting TX.payload+Nonce with sym.key
                    - generate hash  SHA3-512 (encrypted payload)
                    - iterate through TX recipients [A, B] encrypting
                      sym.key with recipient's pub.key (PGP encryption)
A_TX_Manager ← Enclave: encrypted payload, SHA3-512 hash, encrypted keys
A_TX_Manager → A_TX_Manager: store encrypted payload, encrypted sym.key
                             (using hash as index)
A_TX_Manager → B_TX_Manager: (via HTTPS) hash, encrypted (payload, sym.key)
A_TX_Manager ← B_TX_Manager: Ack
A.Node ←  A_TX_Manager: SHA3-512 (encrypted payload)
A.Node →  A.Node: - Replace TX.payload with TX.sha3-512
                  - changes TX.V to 37 or 38 (indicates other nodes that
                    hash represents priv.TX)
A_TX_Manager → Network:  (Ethereum P2P protocol) TX encrypted payload
Network → Network: +block containing TX AB
Network → Node N: block containing TX AB
Node N → Node N: Try validate TX in block
                 - Recognise TX.V is 37 or 38
Node N → Node N TX_Manager: Do nodes holds private TX?
Node N ← Node N TX_Manager: YES  (continue validation)
                         or "NotARecipient" (skip to next TX in block)
A,B Node → A,B enclave: TX payload
           A,B enclave: 1. validates signature
                        2. decrypts sym.key  private key that is held
                           in The Enclave, decrypts the Transaction Payload using
                           the now-revealed symmetric key and returns the decrypted
                           payload to the Transaction Manager.
A,B TX_Manager → A,B EVM: send decrypted payload
A,B EVM → A,B EVM: contract code execution
                   Update Quorum Node's Private StateDB only.
                   NOTE: code discarded once executed.
[[}]]

## EEA Secure Enclave
[[{standards.eea,privacy.private_tx]]
 - Distributed Ledger protocols typically leverage cryptographic techniques
   for transaction authenticity, participant authentication, and historical
   data preservation (i.e. through a chain of cryptographically hashed data
   .) In order to achieve a separation of concerns, as well as to provide
   performance improvements through parallelization of certain crypto-
   operations, much of the cryptographic work including symmetric key
   generation and data encryption/decryption is delegated to the Enclave.
 - The Enclave works hand in hand with the Transaction Manager to
   strengthen privacy by managing the encryption/decryption in an isolated
   way. It holds private keys and is essentially a “virtual HSM” isolated
   from other components.
 - Different implementations of the enclave exists:
   - Constellation: Original, writen in Haskell
   - Crux         : Golang based, compatible with Constellation


 - JS client privateFor ex.: [[dev_framework.js]]
   "privateFor": indicates the list of Tessera (vs Ethereum) public keys
                 of TX recipient. If not empty the TX will be private.
   web3.eth.defaultAccount = eth.accounts[0];
   var simpleSource = 'contract simplestorage { ... }'
   var simpleCompiled = web3.eth.compile.solidity(simpleSource);
   var simpleRoot = Object.keys(simpleCompiled)[0];
   var simpleContract = web3.eth.contract(
       simpleCompiled[simpleRoot].info.abiDefinition);
   var simple = simpleContract.new(42,
       {from:web3.eth.accounts[0],
        data: simpleCompiled[simpleRoot].code,
        gas: 300000,
        privateFor: ["ROAZBWtSacxXQrOe3FGAqJDyJjFePR5ce4TSIzmJ0Bc="]
       }, function(e, contract) {
         if (e) { throw("err creating contract", e); }
         if (!contract.address) {
           console.log(contract.transactionHash + " mining...");
           return;
         }
         console.log("Contract Address: " + contract.address);
       });
[[}]]

## EEA Plugable EVM spec [[{standards.eea,architecture]]
@[https://ethereum.github.io/evmc/]
@[https://github.com/ethereum/evmc]

- Allows to "plug-in" different EVM implementations.

- The EVMC is the low-level ABI between Ethereum Virtual Machines (EVMs) and
  Ethereum Clients. On the EVM side it supports classic EVM1 and ewasm. On the
  Client-side it defines the interface for EVM implementations to access
  Ethereum environment and state.

- It's currently used by the evmone project. (@[https://github.com/chfast/evmone])
  Potentially
  A Java-to-Native (JNI) wrapper looks to exists:
@[https://github.com/semuxproject/evmc-jni]
  See also:
@[https://github.com/jnr/jnr-ffi]
  - Java library for loading native libraries without writing JNI code by hand

- evmONE: 100x faster EVM implementation !!! [[scalability.evm]]
-@[https://github.com/ewasm/benchmarking]
[[}]]

[[{13_SLC.profiling,02_QA,01_PM.TODO]]
## Caliper blockchain performance benchmark
  @[https://github.com/hyperledger/caliper] with support for:
  - test different blockchain solutions with predefined use cases,
    and get a set of performance test results.
    Currently supported blockchain solutions:
    - Hyperledger Fabric v1.X
    - Hyperledger Sawtooth 1.0+
    - Hyperledger Iroha 1.0 beta-3
    - Hyperledger Burrow 1.0
    - Ethereum
    - Hyperledger Besu, utilizing the Ethereum adapter.
    - FISCO BCOS
[[}]]

# Quorum [[{privacy.private_tx,privacy.private_tx.101,01_PM.OUTDATED]] 
         [[02_doc_has.diagram,implementation.quorum,devops,01_PM.low_code]]
@[https://consensys.net/quorum/]
## Originally developed by JP Morgan as an extension to standard geth adding
  support for private transactions and later on adquired by Consensys
  (that also develops Besu in parallel with the idea of support both of them).

## Private transactions are implemented to just a restrictect set of nodes.
  Such nodes will keep 2 states ("blockchains"), one for public transactions
  visible to all nodes, and a second one for private transactions.
  KEY POINT: Private granularity is done at enode scope.

  PRIVATE TX SIMPLIFIED SCHEMA:

  ┌ Node  ───┐     ┌ Node ────┐ • Each node trusted-admin will generate a couple of
  │ @ClientA │     │ @ClientB │   priv/pub keys for the Tessera "side-car", keeping
  │  ┌───────┤     ├───────┐  │   the private key "safe", and distributing the pub.
  │  │Tessera•·····•Tessera│  │   key to peers. Such pub.key will be used as recipient
  └──┴──────•┘     └•──────┴──┘   address when sending private transactions (to node
            ·       ·             or to group).
            └·┐   ┌·┘
              ·   ·               NOTE: Not shown in diagram. Clients and
            ┌─•───•─┬───────┐     regulators ussually have two parallel nodes.
            │Tessera│       │     One validator node that executes/validates
            ├───────┘       │     all incoming transactions in each new block,
            │ Regulator     │     and another node to attend client dApps.
            └ Node ─────────┘      The tessera "side-car" is normally installed
                                  on the dApps node used by dApp clients.
                                  In simple setups, validator can also be re-used
to serve dapps, query the blockchain, send new private/public TXs, but is less secure,
since secrets are more exposed to the rest of the network.

 @[https://raw.githubusercontent.com/jpmorganchase/quorum-docs/master/images/QuorumTransactionProcessing.JPG]
   P┌====================================================================┐
   A│                           (9) TxAB-hash Payload?                   │
   R│                             ┌··················┐   (3,10)          │
   T│      (1) Private TX AB      ·(2)TXPayloadStore ·   En/De─crypt req.│
   Y│┌──────•····▷┌───────────────•───┬······▶┌──────▼─•···→┌───────────┐│
    ││ Dapp │     │ Quorum Node A     ├       │TX Mng A│    │ Enclave A ││
   A│└──────┘     │                   │◀······••────•──┘←···•───────────┘│
    │             │                   │    (6) ·    ┃ TX Resp.(4,11)     │
    │             │  Public  Private  │TX Hash ·    ┃                    │
    │             │  State    State   │        ·    ┃ (5)                │
    │             │  ┌────┐   ┌────┐  │◀·······┘    ┃ TXPayloadStore     │
    │    (8) Block│  ├────┤   ├────┤  │      (12)   ┃ private to A and B │
    │    with TxAB··▷└────┘   └────┘  │TX Payload   ┃                    │
    │ notarization│                   │             ┃                    │
    │         hash└───────────────────┘             ┃                    │
    │                 △                             ┃                    │
    │                 *                             ┃                    │
    └==== (7) Ethere. * ============================┃====================┘
          Standard TX *                             ┃
   P┌====    Protocol * ============================┃====================┐
   A│                 *       (9) TxAB-hash Payload?┃   (10) En/De-crypt │
   R│                 ▽          ┌·············┐    ┃  ┐request          │
   T│             ┌──────────────•────┐       ┌▼────▼──•···→┌───────────┐│
   Y│             │ Quorum Node B     │       │TX Mng B│    │ Enclave B ││
    │             │  Public  Private  │       └•───────┘←···•───────────┘│
   B│             │  State    State   │        ·     Tx Resp.(11)        │
    │             │  ┌────┐   ┌────┐  │        ·                         │
    │    (8) Block│  ├────┤   ├────┤  │        ·                         │
    │    with TxAB··▷└────┘   └────┘  │◀·······┘                         │
    │ notarization│                   │      (12)                        │
    │         hash└───────────────────┘TX Payload                        │
    │                 △                                                  │
    │                 *                                                  │
    └==== (7) Ethere. * =================================================┘
          Standard TX *
   P┌====    Protocol * =================================================┐
   A│                 *       (9) TxAB-hash Payload?                     │
   R│                 ▽          ┌·············┐                         │
   T│             ┌───────────────────┐       ┌▼───────┐    ┌───────────┐│
   Y│             │ Quorum Node C     │       │TX Mng C│    │ Enclave C ││
    │             │  Public  Private  │       └────────┘    └───────────┘│
   C│             │  State    State    ◀·······┘                         │
    │             │  ┌────┐   ┌────┐  │          (12)                    │
    │    (8) Block│  ├────┤   ├────┤  │  TX Not Found                    │
    │    with TxAB··▷└────┘   └────┘  │                                  │
    │ notarization│                   │                                  │
    │         hash└───────────────────┘                                  │
    └====================================================================┘
          △ △ △ △ △ △ △ △ △  ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
          * * * * * * * * *  · · · · · · · · · · · · · ·
          └───────────────┘  └─────────────────────────┘
            Ethereum standard       EEA PRIVATE TX
             p2p Protocol         EXTENSION PROTOCOL

## TESSERA (Private TX)
- Developed in Java, used both by Quorum and Besu.
  ('Orion' was used by the Go Quorum version, but later on its features
   were embedded into Tessera and the first one 'deprecated', 'Orion'
   deprecated the (Haskell implementation) 'Constellation'.
- used as a "side-car" of Besu/Quorum to manage private
  communication of encrypted transactions to targeted nodes. (vs public
  non-encrypted transactions -but still digitally signed- broadcasting
  and propagating to all nodes).
- The enclave, a side-car of the Tessera side-car is use to manage secrets.
  Different enclave plugins exists:
  · local-filesystem keys.
  · Azure Key Vault key pairs.
  · HashiCorp Vault key pairs.
  · AWS Secrets Manager key pairs.

- Each Tessera node:
  - Generates and maintains a number of private/public key pairs
  - Self manages and discovers all nodes in the network (i.e. their
    public keys) by connecting to as few as one other node
  - Provides Private and Public API interfaces for communication:
    Private API - This is used for communication with Quorum
    Public  API - This is used for communication between Tessera
                  peer nodes
  - Provides two way SSL using TLS certificates and various trust
    models like Trust On First Use (TOFU), whitelist, certificate
    authority, etc.
  - Supports IP whitelist
  - Connects to any SQL DB which supports the JDBC client
[[}]]

[[{scalability.offchain,security,01_PM.radar]]
# Hyperledger Avalon, Improving Performance Off-Chain
  @[https://www.infoq.com/news/2019/10/Hyperledger-Avalon-Blockchain/]
  - It aims to move blockchain processing off the main
    chain to dedicated computing resources, e.g. Intel SGX TEE.
    using "computational trust".
  - Broadly supported blockchain project and  organizations like Intel,
    iExec Blockchain Tech, Alibaba Cloud, Baidu, Chainlink, ConsenSys,
    IBM, Microsoft and Oracle.
  - Project previously executed underneath the Trusted Compute Framework(TCF)
    name.
  - collaboration across the Hyperledger project, Enterprise Ethereum
    Alliance and the cloud provider ecosystem.

  - Who is Who:
    Eugene Yarmosh: systems architect at Intel, and has over 20 years
    of experience designing and building distributed and decentralized
    solutions spanning from embedded firmware to large-scale cloud
    solutions. During the last several years, Eugene has focused on
    scalability and privacy solutions for public and private blockchains,
    specifically utilizing HW based trusted execution environments (TEE)
    for off-chain workload execution. Eugene is an editor of the EEA
    Off-chain Trusted Compute Specification and is a lead architect for
    Hyperledger Avalon, a ledger-independent reference implementation of
    the Trusted Compute specification. He also holds several patents.
[[}]]


