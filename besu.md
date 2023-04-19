[[{10_EVM.implementation.besu,standards.eea,standards.eea,10_EVM.implementation.besu.architecture]]
# Besu
* Consensys implementation of Ethereum nodes supporting pluglable architectures for 
  consensus, storage, ...

## QBFT PoA Consensus (Permissioned Networks) [[{consensus.IBFT]]
* Evolution built on BFT consensus principles.
* written in Dafny by Roberto Saltini.
* enabling formal verification of its correctness, based on work done
  by Henrique Moniz, it fixes some potential issues in IBFT in 
  certain configurations.
* Official spec: @[https://entethalliance.github.io/client-spec/qbft_spec.html]
[[}]]


## IBFT Consensus (Permissioned Networks) [[{consensus.IBFT]]
**WARN:** Replaced by newer QBFT consensus. QBFT is now the recomended consensus for private networks.
- Consensus with TX finality -vs probabilistic-. When the TX is accepted we are sure
  that all nodes will see it and no future reordering will happen (at the cost of
  more centralization in validator nodes).

@[https://github.com/ethereum/EIPs/issues/650]
- IBFT: stands for Istambul Bizantine Fault Tolerant
- Target banks and fin.instutions, replacing PoW
  since validator scalability is not required.
- Hash settlement finality and minimum latency.
- Deeply inspired by Clique PoA @[https://github.com/ethereum/EIPs/issues/225]
- also inspired by Hyperledger's SBFT, Tendermint, HydraChain, and NCCU BFT.

```
   ROUND                                        ROUND STATE
  Consensus round. A round starts with         Consensus messages of a specific
  the proposer creating a block proposal       sequence and round, including
  and ends with a block commitment or          pre-prepare message, prepare message,
  round change.                                and commit message.
  
   PROPOSAL                                  SEQUENCE
  New block generation proposal which is    Sequence number of a proposal. A
  undergoing consensus processing           sequence number should be greater than
                                            all previous sequence numbers.
                                            Currently each proposed block height is
                                            its associated sequence number.
  
   BACKLOG                                   CONSENSUS PROOF:
  The storage to keep future consensus      The commitment signatures of a block
  messages due to the async nature of the   that can prove the block has gone
  network.                                  through the consensus process.
  
   SNAPSHOT:
  The validator voting state from last
  epoch
```

  VALIDATION ROUND LOOP
  [validators] → [validators]:  enter  validator.state NEW-ROUND
  [validators] → [validators]:  pick one (round-robin by default or sticky) as
                                the   PROPOSE
    PROPOSE    →  PROPOSE    :  propose new block proposal
    PROPOSE    →  network    :  broadast   block-proposal + PRE-PREPARE message
  [validators] → [validators]:  enter  validator.state PRE-PREPARED
  [validators] → network     :  broadcast   PREPARE message
                                (make sure all validators are working on the
                                 same sequence and the same round)
  [validators] → [validators]:  wait for (2F + 1) PREPARE messages
                                then enter  validator.state PREPARED
  [validators] → network     :  broadcasts   COMMIT message .
                                (inform peers that validator accepts proposed block
                                and is going to insert the block to the chain)
  [validators] → [validators]:  wait for (2F + 1) COMMIT messages
                                enter  validator.state COMMITTED
                                insert the block to the chain
                                enter  validator.state FINAL-COMMITTED
  [validators] → network     :  broadcasts   ROUND-CHANGE message
  [validators] → [validators]:  wait for (2F + 1) ROUND-CHANGE messages
                                then enter  validator.state NEW-ROUND


  RUNNING ISTANBUL BFT VALIDATORS&AMP;NODES:
  $ geth  --datadir "/eth" init "/eth/genesis.json"                   // ← Initialize the data folder as (PRE-SETUP)
  $ geth --datadir "/eth" --mine --minerthreads 1 --syncmode "full"   // ← Start-up validators
  $ geth --datadir "/eth"                                             // ← Start-up regular nodes

  ISTANBUL OPTIONS:
  --istanbul.requesttimeout value  round in milliseconds (default: 10000)
  --istanbul.blockperiod    value  Default min.difference between two consecutive
                                   block's timestamps in seconds (default: 1)

  NODEKEY AND VALIDATO
  To be a validator, a node needs to meet the following conditions:
  - Its account (nodekey-derived) address MUST be listed in extraData's validators section
  - validator nodekey is used as priv.key to sign consensus messages

  Encoding:
  Before encoding you need to define a toml file with vanity and validators fields
  to define proposer vanity and validator set. Please refer to example.toml for
  the example. The output would be a hex string which can be put into extraData
  field directly.  Command:
  $ istanbul encode --config ./config.toml

  Decoding:
  Use --extradata option to give the extraData hex string. The output would show
  the following if presents: vanity, validator set, seal, and committed seal.
  Command:
  $ istanbul decode --extradata <EXTRA_DATA_HEX_STRING>
  to define proposer vanity and validator set. Please refer to example.toml for
  the example. The output would be a hex string which can be put into extraData
  field directly.  Command:
  $ istanbul encode --config ./config.toml

  genesis.json
  - config field is required, and the pbft subfield must present. Ex:
  - See also genesis.json helper tools at:
  @[https://github.com/getamis/Istanbul-tools]
  {
    "config": {
      "chainId": 2016,
      "istanbul": { "epoch": 30000, "policy" 0 }
    },
    "timestamp": "0x0",
    "parentHash": "0x000...000",
    "extraData": "0x0000...000f89af85494475...aad0312b84100000...0c0",
    "gasLimit": "0x47e7c4",
    "mixhash": "0x6374...6e6365",
    "coinbase": "0x333...33333",
    "nonce": "0x0",
    "difficulity": "0x0",
    "alloc": {}
  }
[[consensus.IBFT}]]
### High level component architecture [[{02_doc_has.diagram]]
- External Resources
* Chat     : @[https://chat.hyperledger.org/channel/besu]
* Releases : @[https://github.com/hyperledger/besu/releases]
* Core Devs: @[https://github.com/hyperledger/besu/graphs/contributors?from=2021-06-01&to=2022-02-01&type=c]

- Java based, using VertX as core framework.
- Apache 2.0.
- Supports different plugable consensus (Ethash-PoW/Mainnet, Clique-PoA/Goerli testnet,
  IBFT2/private networks requiring X-finality.
- Private TXs.
- GraphQL.
- OnChain permissioning of allowed TX-signers and allowed nodes for permissioned networks.
  (Deprecated as inidicated in https://github.com/ConsenSys/permissioning-smart-contracts)
- OpenSource / Enterprise version.

Extracted from old gitter channel: 2019-03-27
https://gitter.im/PegaSysEng/pantheon

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              JSON RPC                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
╔═ CORE ("Mining") ═════╗ ╔ CHAIN PROCESSING ═══════╗ ╔ P2P ══════════════════════════════════╗
║╔═ SYNCHRONIZER ══════╗║ ║ PROTOCOL SPEC:          ║ ║╔ ETH SUB-PROTOCOL ═══════════════════╗║
║║ ● DOWNLOADER        ║║ ║ Update chain-of-blocks: ║ ║║┌ ETH PEER ─────────┐─┌ EXECUTORS ──┐║║
║║                     ║║ ║                         ║ ║║│                   │ │             │║║
║║ ● BLOCK PROPAGATION ║║ ║ ● BLOCK     ● TX        ║ ║║│ ● WIRE-CONNECTION │ │● SYNC WORKER│║║
║║   MANAGER           ║║ ║   HEADER      VALIDATOR ║ ║║│ ● REQUEST-MANAGER │ │● TX WORKER  │║║
║╚═════════════════════╝║ ║   VALIDATOR             ║ ║║│ ● PEER-REPUTATION │ │● SCHEDULED  │║║
║╔ TX POOL ════════════╗║ ║                         ║ ║║│ ● CHAIN-STATE     │ └─────────────┘║║
║║ ● PENDING  ● TX     ║║ ║ ● BLOCK     ● BLOCK     ║ ║║└───────────────────┘                ║║
║║   TXs        SENDER ║║ ║   IMPORTER    PROCESSOR ║ ║║ ● ETH MESSAGER                      ║║
║╚═════════════════════╝║ ╚═════════════════════════╝ ║╚═════════════════════════════════════╝║
║ ● MINER               ║                             ║┌─WIRE P2P PROTOCOL──────────────────┐ ║
╚═══════════════════════╝                             ║└────────────────────────────────────┘ ║
                                                      ║┌ DISCOVERY AGENT ───────────────────┐ ║
            ╔═ STATE  ══════════════════╗             ║└──▲─────────────────────────────────┘ ║
            ║┌ WORLD───┐ ┌ BLOCKCHAIN ┐ ║             ╚═══│═══════════════════════════════════╝
            ║│ STATE   │ │            │ ║       • DEVp2 Peer Discovery
            ║│ ARCHIVE │ │            │ ║         . UDP-based system to discover other nodes
            ║└─────────┘ └────────────┘ ║         . Based on a  well-known set of boot nodes .
            ║┌CONSENSUS┐ ┌ SYNC STATE ┐ ║           . Recursively looks up new peers (neighbors)
            ║└─────────┘ └────────────┘ ║             from known peers.
            ╚═══════════════════════════╝       • DISCOVERY (of (neighbors IP) PACKET EXCHANGE
                                                  Node_A → Node_B: Ping
                                                  Node_A ← Node_B: Pong
                                                  Node_A → Node_B: Find Neighbors
                                                  Node_A ← Node_B: known-neighbors list
[[}]]

  besu  /                                $ bin\besu --config=my.cfg \
     ├─ bin/ (install)                 $   --data-path=/var/lib/besu/node1 \
     ├─ lib/ (install)                 $   --genesis=my.genesis \
     ├─ key  (run─time) eNode Priv.key $   --max-peers=5 \
     │  (--data-path)                  $   --rpc-enabled
     └─ ddbb (run─time) RocksDB data   ( LOGS go to STDOUT )
        (--data-path)

## Understanding codebase. [[{]]
### STARTUP SEQUENCE
@[https://github.com/hyperledger/besu]

    Initial                    Create                      Create                    Run Runner
    Bootstrap             ->   BesuController.java     ->  Runner.java           ->  instance!!
  ┌──────────────────────┐  ┌─────────────────────────┐   ┌───────────────────────┐
  - Parse cli flags         It will collect all bck        RunnerBuilder.java
  - (cli/BesuCommand.java)  related config&services:       -> Runner.java
  - parse config file,      - chain+world state DBs
  - load|generate node      - StorageProvider:           - Contains services for:
    key-pair                  InMemory + RocksDB      ┌··- Network startup
  - parse genesis file      - Genesis Config File     ·  - Besu COntroller
                        ┌···- Node keypair            ·  - JSON RPC
                        ·   - ProtocolSchedule        ·  - WebSocket RPC
┌···························  + ProtocolSpec          ·  - Plugable Metrics System
·                       ·   · Synchronizer            ·    (Prometheus, ...)
· ┌·····················┘   - Transaction Pool        ·  - Data directory
· ·                         - Miner                   ·
· ·                                                   ·
· └ Valid for a "bunch of blocks" in the chain        ·
·   (validators and proccessor applying to Byzantium, ·
·   Constantinople,... The ProtocolSchedule "groups   ·
·   them all" mapping milestone block-ranges to       ·
·   specific protocol logic                           ·
·   (ethereum/mainnet/ProtocolSpec.java)              ·
·                                                     ·
· ┌···················································┘         [[{02_doc_has.diagram.sequence]]
· ·                                                    ┌······· (UDP) PEER DISCOVERY
· └· Runner                                            ·        - Recursive, starting with
·    └> Network Startup:                               ·          "well-known-set-of-boot-nodes"
·       └> Discover Neighbords                         ·          NODE -> PEER: "PING"
·          └> Setup connections                        ·          NODE <- PEER: "PONG"
·             > DEV-P2P Wire Protocol (RLPx)        ┌··┴····┐     NODE -> PEER: "FIND Neighbors"
·               . Manages peers [capabilites/status,discovery,    NODE -> PEER: Neighbors list
·                                reputation("best to talk to")] [[}]]
·               . Peer Authentication
·               . Encryption (ECIES based on node Pub/Priv keys)
·               . Compression
·               . Keep Alive
·
·             > DEV-P2P Subprotocol
·               - Pluggable subprotocols handling extended consensus
·                 mechanisms such as Eth, Ibft, Istanbul64Protocol
·               - Defines the set and appropiate ordering of messages
·                 on the network.
·               -  PROTOCOL MANAGE:
·                 "Acumulates the logic of different subprotocols"
·                 a) Processes incoming messages for their subprotocol
·                 b) Sends outbound messages to other nodes using this
·                    subprotocol
·
·               - Example Sample Message Set for EthPV62:  [[{101]]
·                 [ STATUS , NEW_BLOCK_HASHES , TRANSACTIONS,
·                   GET_BLOCK_HEADERS, BLOCK_HEADERS, GET_BLOCK_BODIES,
·                   BLOCK_BODIES , NEW_BLOCK ]  [[}]]
·
└> SYNCHRONIZER: Manages the overall sync runtime
   - ChainDownloader Loop:
     1) Find best peer to sync from (best new data)
     2) Pull checkpoint headers (Multithreaded downloading)
     3) Pipelined blocks Import
        - Download and validate headers
        - Download bodies
        - Extract TX senders (PKI key recovery)
        - Validate / Persist blocks
     4) "repeat"

  - "MUST TO" video explaining the general architecture :
  @[https://www.youtube.com/watch?v=OJfib9kTK7U]

 - REF:
   https://github.com/hyperledger/besu/blob/master/besu/src/main/java/org/hyperledger/besu/cli/BesuCommand.java
   https://github.com/hyperledger/besu/blob/master/besu/src/main/java/org/hyperledger/besu/controller/BesuController.java]
   https://github.com/hyperledger/besu/blob/master/ethereum/core/src/main/java/org/hyperledger/besu/ethereum/mainnet/MainnetProtocolSpecs.java
[[}]]

[[{dev_framework.java.web3j]]
## Web3J(ava) Private TX Extensions
   https://github.com/web3j/web3j/blob/master/besu/src/test/java/org/web3j/protocol/besu/RequestTest.java
   https://github.com/web3j/web3j/blob/master/besu/src/test/java/org/web3j/protocol/besu/ResponseTest.java

   - Extracted from Initial Pull Request:
   @[https://github.com/web3j/web3j/pull/767]
   ikirilov : ... propose we reconcile common calls for geth and Besu.
   benesjan : ... There is one issue with creating common Geth and Besu module.
                  Geth's version of minerStart accepts parameter threadCount and
                  Besu's version does not. So unifying those two might be confusing.
   conor10  : ... let’s leave the duplication in for now ...
[[}]]

## CLI Summary [[{devops.besu,13_SLC.monitoring]]
  besu  blocks import   imports blocks from file into database.       [[{devops.besu.backups]]
  besu  blocks export   exports a specific block, or list of blocks
                        into file                                     [[}]]

  besu  public-key export <- print node public key  to STDOUT
  besu  public-key           (export-address to print address)

  besu  password hash   <- generate hash of a given password

  besu  retesteth       <- Run a Retesteth compatible server for (re)ference (test)s
                           https://ethereum-tests.readthedocs.io/en/develop/index.html
                           "Common tests for all clients to test again"

  besu  rlp encode     <- encode JSON to RLP hex string

  besu  operator \     <- generates node keypairs+genesis file
   generate-blockchain-config                           (with RLP encoded IBFT 2.0 extra data).

  Common CLI Options: (Precedence order: cli flags, ENV.VARs, config file)
@[https://besu.hyperledger.org/en/stable/Reference/CLI/CLI-Syntax/]
Updated 2019-10-21

  --banned-node-ids=bannedNodeId1,bannedNodeId2,...              [[{security.aaa.besu}]]
  --bootnodes=enode://id@host1:port1,enode://id@host2:port2,...
  --data-path=dir_path
  --discovery-enabled=false
  --genesis-file=file_path   # --network is enough for public main/test nets.

 GraphQL
  --graphql-http-cors-origins="graphQLHttpCorsAllowedOrigins"
  --graphql-http-enabled
  --graphql-http-host="host" # defaults to 127.0.0.1
  --graphql-http-port="port" # defaults to 8547.

 Host Whitelist
  --host-whitelist=host1,host2,... or "all"  # allowed host list to JSON-RPC
                                           # Defaults to 127.0.0.1, recomended.
  --key-value-storage="keyValueStorageName"# Use only if using a storage system
                                           # provided with a plugin. Default:rocksdb
  --max-peers=N                            # Specifies the maximum P2P connections
                                           # that can be established. The default is 25.
 Metrics
  --metrics-category="Comma separated list"# BIG_QUEUE, BLOCKCHAIN, EXECUTORS, JVM, NETWORK,
                                           # PEERS, PROCESS, ROCKSDB, RPC, SYNCHRONIZER.
  --metrics-enabled=true                   # Defaults to false
                                           # incompatible with --metrics-push-enabled.
                                           # (either push or pull can be enabled)
    More info at: @[https://docs.pantheon.pegasys.tech/en/stable/HowTo/Deploy/Monitoring-Performance/]
  --metrics-host=prometheus_host           # --host-whitelist is respected
  --metrics-port=tcp_port                  # default to 9545
  --metrics-push-enabled=true|false        # incompatible with --metrics-enabled.
                                           # (either push or pull can be enabled)
                                           # --host-whitelist is respected
  --metrics-push-interval=number_of_secs   # default is 15.
  --metrics-push-port=tcp_port             # default to 9001.
  --metrics-prometheus-job=prometheus_Job

 MINING
  --miner-coinbase=valid_coinbase          # applies with --miner-enabled (or miner_start JSON-RPC method)
                                           # ignored by Clique, IBFT 2.0 consensus
  --miner-enabled
  --miner-extra-data="32 bytes hex string" # will be include in extra-data-field of mined block
                                           # default to 0x.
  --min-gas-price=minTransactionGasPrice

 NAT TRAVERSAL
  --nat-method=UPNP                        # UPNP | NONE(default)
                                           # Can NOT be used with Docker image

 PUBLIC ETH. NET
 --network=$NETWORK                        ropsten (PoW), rinkeby (PoA+Clique),
                                           goerli  (PoA+Clique), dev (very low PoW difficulty)
                                           (Use --genesis-file for non-standard networks)
 --network-id="P2P net. integer ID"        # overrides chain ID in genesis file

 NODE PRIVATE KEY                          (cloud extensions exists to retrieve from AWS/Azure/...)
 --node-private-key-file=file_path         # Defaults to data directory. If NOT found a key file
                                           # containing the generated private key is created;
                                           #  WARN: The private key is not encrypted!!!
 GOSSIP PROTOCOL
 --p2p-enabled=true * |false
 --p2p-host=p2p_listening_host            # default to 127.0.0.1
 --p2p-interface=ip_nterface              # default to 0.0.0.0 (all interfaces).
 --p2p-port=tcp_port                      # default to 30303.
 --remote-connections-limit-enabled=true * |false    # TIP: In private networks with a level of trust
                                                     # between peers, disabling it may increase speed
                                                     # at which nodes can join the network.
                                                     # WARN: Always enable in pub.nets to avoid
                                                     #       eclipse attacks, specially with fast-sync.
 --remote-connections-max-percentage=...             # 0 to 100, defaults to 60

  --permissions-accounts-config-file-enabled=true|false * # enable file-based account level perm.
                                                          # enable file-based account level perm.
  --permissions-accounts-config-file=path  # Default to permissions_config.toml
                                           # Tip  --permissions-accounts-config-file and
                                           #      --permissions-nodes-config-file    can use the same file.
  --permissions-accounts-contract-enabled=true|false *
  --permissions-accounts-contract-address= # contract address for onchain account permissioning.
  --permissions-nodes-contract-address=    # contract address for onchain node permissioning.
  --permissions-nodes-config-file-enabled=true|false
  --permissions-nodes-config-file=file     # Default to ${BESU_DATA_PATH}/permissions_config.toml
  --permissions-nodes-contract-enabled=true|false *

 PRIVACY: ("Tessera configuration")
  --privacy-enabled=true|false
  --privacy-marker-transaction-signing-key-file=file  # priv.key used to sign Privacy Marker Transactions.
                                                      # If not set, each TX is signed with a different
                                                      # randomly generated key.
  --privacy-precompiled-address=priv.Precomp.Address  # default to 126
  --privacy-public-key-file=privacyPublicKeyFile      # pub.key of the Tessera node.
  --privacy-url=privacyUrl                            # URL on which Tessera node is running.

  DEBUG
  --revert-reason-enabled=true|false *                # Why default to false?
                                                      # Enabling it use a significant amount of memory.
                                                      # Not recommended for public Ethereum networks.
 HTTP APIs
  --rpc-http-api=csv of enabled APIs through HTTP     # --rpc-http-enabled must also be set to take effect
                                                      #  ADMIN, ETH, NET, WEB3, CLIQUE, IBFT,
                                                      #  PERM, DEBUG, MINER, EEA, PRIV,TXPOOL.
                                                      #  default: ETH, NET, WEB3
                                                      #  Investigate what CLIQUE, IBFT, PRIV, TXPOOL, .. means
  --rpc-http-authentication-credentials-file=$file
  --rpc-http-authentication-enabled=true|false *
  --rpc-http-cors-origins=csv of URLs or "all"        # Domain URLs must be enclosed in double quotes
                                                      # Needed for Remix and any other browser app
                                                      # Defaults to "none" (browser apps cannot interact with node)
                                                      # To use Bese as MetaMask backend anywhere, set it to "all"/"*"
  --rpc-http-enabled=true|false *
  --rpc-http-host=$host                               # default to 127.0.0.1
  --rpc-http-port=$port                               # default to 8545
 Web Socket APIs
  --rpc-ws-api=csv of enabled APIs through Web Socket # --rpc-ws-enabled must also be set to take effect
                                                      #  ADMIN, ETH, NET, WEB3, CLIQUE, IBFT,
                                                      #  PERM, DEBUG, MINER, EEA, PRIV,TXPOOL.
                                                      #  default: ETH, NET, WEB3
  --rpc-ws-authentication-credentials-file=$file
  --rpc-ws-authentication-enabled=true|false *        # WARN: auth. requires a token passed by header, not
                                                      # currently supported by 'wscat'
  --rpc-ws-enabled=true|false *
  --rpc-ws-host=$host                                 # default to 127.0.0.1
  --rpc-ws-port=$port                                 # default to 8546

  GAS LIMIT CONFIGURATION:
  --target-gas-limit=$GAS_LIMIT_INTEGER               [[{10_EVM.gas]]
    Specifies the block gas limit toward which Besu will gradually move on an existing network,
    if enough miners are in agreement.  Use it to change the block gas limit set in the
    genesis file without creating a new network .
    The gas limit between blocks can change only 1/1024th , so this option tells the
    block creator how to set the gas limit in its block:
    - If the values are the same or within 1/1024th, the limit is set to the specified value.
    - Otherwise, the limit moves as far as it can within that constraint.
    - If not specified, block gas limit remains at the value specified in the genesis file.
  [[}]]

  PENDING TX POOL [[{architecture.async]]
  --tx-pool-max-size=integer                        # Max TX num.kept in pending TX pool.
                                                    # Default to 4096.
  --tx-pool-retention-hours=integer                 # Max hours to retain pending TX in TX pool.
                                                    # Default to 13h.
  [[}]]

  LOGGING
  --logging=OFF|FATAL|ERROR|WARN|INFO * |DEBUG|TRACE|ALL

  FAST SYNC
  --sync-mode=FAST|FULL *
  WARN: FAST mode, most historical world state data is unavailable.
        Any methods attempting to access unavailable world state data return null.
  --fast-sync-min-peers=integer                     # Minimum peer number before start fast-sync.
                                                    # Default is 5.
[[}]]

[[{10_EVM.implementation.besu,integration.graphql]]
## GraphQL Schema 
@[https://github.com/hyperledger/besu/blob/master/ethereum/api/src/main/resources/schema.graphqls]

schema {
    query: Query
    mutation: Mutation
}

TYPES:
 - Query, Account, Log, Transaction, Block,
 - CallResult, SyncState, Pending  (State)

type Query {
    account(address: Address!, blockNumber: Long): Account!
    block(number: Long, hash: Bytes32): Block!
    blocks(from: Long!, to: Long): [Block!]!
    pending: Pending!
    transaction(hash: Bytes32!): Transaction
    logs(filter: FilterCriteria!): [Log!]!
    gasPrice: BigInt!
    protocolVersion: Int!
    syncing: SyncState
}

type Mutation {
    sendRawTransaction(data: Bytes!): Bytes32!
}

INPUTS:
  - BlockFilterCriteria: (filter applied to a single block)
  - CallData
  - FilterCriteria : Filter applied from block to block)
[[}]]

[[{10_evm.implementation.besu]]
## What's new
### EEA-Quorum 21 (2021-03-09)
  REF:
  @[https://consensys.net/blog/quorum/consensys-quorum-21-1-0-features-enhanced-ethereum-mainnet-compatibility/]
  - Enhanced compatibility between Besu and GoQuorum.
  - lower infrastructure costs
  - Besu mainnet Improvements for Network Upgrades, Database and Storage:
    - Compatibility with MainNet Berlin Network Upgrade
      (next planned MainNet hard fork)
      -  addition of subroutines to the EVM.
      -  introduction of  "transaction envelopes"  making it simpler for Ethereum
         to support several different kinds of transactions
      -  changes in gas costs to increase the security of the network.
         WARN : Use 21.1.2 or higher.   21.1.0 contains an outdated version  of Berlin upgrade.
      -  Mainnet Launcher "wizard"
      -  Bonsai Tries (Early Access): new database format reducing  [[{02_doc_has.comparative]]
         storage requirements and improving performance for "recent state"
         operations.
         NON-BONSAI TRIES                 BONSAI TRIES
         - multi-trie key/val store     - single trie.
                                        - one set of indexed leafs
                                        - N diffs that can be used
                                          to move the trie forward
                                          or backwards.
                                        --------------------------
                                        - reduce chain head count and
                                          state read and write amplification
                                          from 10x-20x levels to 1x-2x for
                                          non-committed access.

                                        - Note: only full sync currently supported.
         [[}]]

  -  New monitoring API detects nodes non initiating or receiving TX
     for a period-of-time and stops+hibernates them to reduce infra. cost.

  -  Multi-Tenancy in GoQuorum/Tessera nodes.             [[{governance.multitenant]]
     Allows multiple private states(MPS) for different tenants
     using the same GoQuorum node, with each tenant having
     its own private state(s).                            [[}]]

### EEA-Besu 1.4
  └ Plugin API  allows to fetch data from running Besu node:

    BESU  -> (data) -> Besu 1.4+ -> feed to DDBBs, kafka, ...
    node     ^^^^^^    Plugin-API
            Blocks,
            Balances, TXs, SC,
            Logs,  ...
  └ future work: Besu will compartmentalize key supporting services, eventually
                 allowing them to be swapped via a plugin.
                 Ex: PegaSys Plus 1st release, made DDBB swappable to support
                     encryption at rest.

  └ privacy use in a multi-tenacy environment; [[{governance.multitenant]]
  @[https://pegasys.tech/increase-adoption-and-cut-costs-with-multi-tenancy-on-hyperledger-besu/]
    (many clients re-using the same Ethereum client node
     whilst maintaining the privacy and confidentiality )
    with support for authenticated API access and allowing hosts who
    standup the infrastructure custom control on who to grant access to,
    at various levels of granularity depending on the
    users need,   coupled with Tessera private TX manage  .
    - By using   JWT tokens , a user identity is tied to a privacy
      identity, validating every API call to ensure the user
      is part of the privacy group before any data is revealed.
    (WiP for EthSigner and PegaSys Orchestrate multi-tenancy)   [[}]]
  └ Early access to flexible privacy groups allowing addition and
    removal of privacy group members.
  └ New tracing APIs
  └ Event Streaming Improvements
  └ Advanced Key Management
  └ Flexible privacy calls
  └ End to end encryption with TLS links between PegaSys suite products

### EEA-Besu 1.2 Release: (2019-08)
  - improvements to our privacy groups
  - Account-level Permissioning
  - Improved Privacy Groups:
  - EthSigner for External Key Management
    Hashicorp KeyVault and Azure Key Vault
  - New GraphQL Interface:
  - Support for UPnP (dynamic inbound connections in routers)
[[}]]

## DevOps [[{standards.eea,10_EVM.implementation.besu,devops.besu]]
          [[infrastructure.storage.offchain,13_SLC.monitoring]]

### EEA-Besu IBFT 2.0 BOOTSTRAP

  PRE-SETUP)  [[{devops.troubleshooting.performance]]
  - Linux: In MainNet and "large" nets increase max.number
            of open files allowed: $ sudo ulimit ...    [TODO]
            to avoid the "Too many open files RocksDB exception". [}]]

@[https://besu.hyperledger.org/en/stable/Tutorials/Private-Network/Create-IBFT-Network/]

 STEP 01: BOOTSTRAP NODE CONFIGURATION)
 --------------------------------------
 (key / key.pub for each node can be generated

 INPUT               ->  BOOTSTRAP                        ->  OUTPUT
                         SCRIPT                               (INPUT TO NODE CONFIG)
 --------------------    --------------------------------     -------------------------
                                                              (Move to each new node)
  ibftGenesis.json       $ besu operator \                     ./networkFiles/
  ^^^^^^^^^^^^^^^^        generate-blockchain-config  \        ├  genesis.json
  |                          --config-file=ibftGenesis.json \  └  keys
  {                          --to=networkFiles \                  0x--20 bytes addr1/
   "genesis": {              --private-key-file-name=key          ├ key
     "config": {                                                  └ key.pub
        "chainId": 2018,                                          0x--20 bytes addr2/
        "constantinoplefixblock": 0,                              ├ key
        "ibft2": {                                                └ key.pub
          "blockperiodseconds": 2,                                0x--20 bytes addr3/
          "epochlength": 30000,                                   ├ key
          "requesttimeoutseconds": 10                             └ key.pub
        }                                                         0x--20 bytes addr4/
      },                                                          ├ key
      "nonce": "0x0",                                             └ key.pub
      "timestamp": "0x58ee40ba",                                  ^
      "gasLimit": "0x47b760",                                     ·
      "difficulty": "0x1",                                        ·
      "mixHash": "0x-- 32 bytes   ^1 --",                         ·
      "coinbase": "0x00...20bytes..00",                           ·
      "alloc": {                                                  ·
         "40 hex-digits account01.": {                            ·
            "balance": "0x..."                                    ·
         },                                                       ·
         ...
        },                                                        ·
      "extraData": "0x... (RLP encoded)...",                      ·
   },                                                             ·
                                                                  ·
   "blockchain": {                                                ·
     "nodes": {                                                   ·
       "generate": true,                                          ·
         "count": 4       <··· number of node key pairs to be generate
     }                         4+ validators needed in IBFT 2.0 to really
   }                           be BFT
  }
   ^1 :0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365


 STEP 02: Start the Network (Example script)
 --------------------------
 $ export COMMON=""
 $ export COMMON="$COMMON --data-path=data"
 $ export COMMON="$COMMON --genesis-file=../genesis.json"
 $ export COMMON="$COMMON --rpc-http-enabled --rpc-http-api=ETH,NET,IBFT"
 $ export COMMON="$COMMON --host-whitelist='\*' --rpc-http-cors-origins='all'"
 $ besu $COMMON --bootnodes=$ENODE1_URL --p2p-port=30306 --rpc-http-port=8548

 $ curl -X POST \     <- STEP 3) Confirm Network is Working
   --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
   localhost:8545
 -- Output must confirm 3 peers for node 1
   { ...  "result" : "0x3" }
  (Check also logs confirming blocks being produced after
   cluster nodes are in sync -it can take a few minutes for big chains)

 - Add/Remove validators using the IBFT REST API:
  @[https://besu.hyperledger.org/en/stable/Reference/API-Methods/#ibft-20-methods]
  PRE-SETUP: run besu with flags '--rpc-http-api' and/or '--rpc-ws-api'

  REST API:
  PROPOSAL TO ADD/DEL VALIDATOR          DISCARDS PENDING PROPOSAL            GET PENDING VOTES
  =============================          =========================            =================
  METHOD="ibft_proposeValidatorVote"     METHOD="ibft_discardValidatorVote"   Returns json Map address:vote
  PARAMS='["0x..40hex-digit addr",true]' PARAMS='[$VALIDATOR_A_ADDR]'         METHOD="ibft_getPendingVotes"
  curl -X POST --data \                  curl -X POST --data \                curl -X POST --data \
  '{"jsonrpc":"2.0",                      '{"jsonrpc":"2.0",                  '{"jsonrpc":"2.0",
    "method":"$METHOD",                     "method":"$METHOD",                 "method":"$METHOD",
    "params":$PARAMS,                       "params":$PARAMS,                   "params":[],
    "id":1}' $NODE_URL                      "id":1}' $NODE_URL                  "id":1}' $NODE_URL

  - LISTS VALIDATORS @ BLOCK-HASH                   - LISTS VALIDATORS @ BLOCK NUMBER.
    - Returns list of validator addresses             - Returns list of validator addresses.
      METHOD="ibft_getValidatorsByBlockHash"            METHOD="ibft_getValidatorsByBlockNumber"
      PARAMS='["0x... 64 hex-digit block hash"]'        PARAMS='["latest"]' # N|earliest|latest
      curl -X POST --data \                             curl -X POST --data \          |pending
      '{"jsonrpc":"2.0",                                '{"jsonrpc":"2.0",
         "method":"$METHOD",                              "method":"$METHOD", \
         "params":$PARAMS,                                "params":$PARAMS, \
         "id":1}' $NODE_URL                               "id":1}' $NODE_URL


  GET VALIDATOR METRICS FOR BLOCK-RANGE:
  ======================================
  Returns: Block number of last-block-proposed-by-each-validator
           All validators present in the last-block in range
  Note: genesis block proposer has address 0x000...0.
  - Example
    METHOD="ibft_getSignerMetrics"
    PARAMS='["1", "100"]' <- [from, to] blocks (defaults to last 100 blocks)
    curl -X POST --data \
    '{"jsonrpc":"2.0",
      "method":"$METHOD",
      "params":$PARAMS,
      "id":1}' $NODE_URL


## Disk/RAM Ussage  [[{devops.besu.storage]]
(reference estimation)
                          DISK Space:  RAM:
test/private network      -200+MB      - 4+GB RAM
mainnet/public-test-net   -1.5+TB      - 8+GB RAM

Notes: 2019-01
Testing with besu-quick-start and IBFT 2.0 with defaults settings
(1 block each 5? seconds) the disk compsumption is:

          1 hour     1 day      1year
          2044K      47.9MB     17485.8MB
IBFT2 Consensus Case:
- Each mined block has a minimum length of 648 bytes for empty blocks.
- With a block-period configured to 5 seconds, this leads to:

print( ( 648 / (1024. * 1024.) ) * 12      * 60       * 24)      ~  10.68 MBytes/day
         ^^^^^^^^^^^^^^^^^^      ^         ^          ^           ^^^^^^^^^^^^^^^^
        block-size in MBytes   blks/min  mins/hour   hours/day    Minimum ussage.
                               5secs/blk                          Just empty blocks.
                                                                  No indexes, external
                                                                  logs, file-system
                                                                  metadata, ...
  [[}]]

[[}]

## EEA-Besu Monitoring [[{10_evm.implementation.besu,13_SLC.profiling]]
(with Prometh.+Grafana)
FROM @[https://gitter.im/PegaSysEng/pantheon] on 2019-05-29 20:01
- Adrian Sutton@ajsutton
  We've just published a Grafana dashboard as an example for
  monitoring Pantheon nodes:
   whether they're in sync , number of peers, cpu and memory usage etc.
  It's available at:
  @[https://grafana.com/dashboards/10273] and instructions for
  setting up Pantheon and Prometheus is at
  @[https://pantheon.readthedocs.io/en/stable/Using-Pantheon/Monitoring/#setting-up-and-running-prometheus-with-pantheon]
  ...
  I did sneak some extra metrics into trunk yesterday so the board
  work best with a build from master or anything from 1.1.2 onwards
  once it's released.


REF: @[https://lists.hyperledger.org/g/besu/message/34]
Re: How to Monitor Performance for Multiple Nodes?
...  you can use the promethus metrics server.
(--metrics-enabled and --metrics-categories=JVM,PROCESS).
In addition to enabling it you would need a prometheus server
to poll the metrics and something like grafana to make it presentable.

Here is a mechanical dump of all of the Prometheus metrics that we currently can export:

@[https://gist.github.com/shemnon/bff32ff78ff42cb2d51f76effba0d311]
Most relevant are the jvm_ and process_ metrics, which are standard prometheus names.

Block gas limit of the current chain head block
Gas used by the current chain head block
Number of ommers in the current chain head block
Timestamp from the current chain head
Number of transactions in the current chain head block
Total difficulty of the chainhead
Current number of threads executing tasks
Total number of tasks executed
Current number of threads in the thread pool
Current number of tasks awaiting execution
Total number of tasks rejected by this executor
Total number of tasks executed
Current number of threads executing tasks
Total number of tasks executed
Current number of threads in the thread pool
Current number of tasks awaiting execution
Total number of tasks rejected by this executor
Total number of tasks executed
Current number of threads executing tasks
Total number of tasks executed
Current number of threads in the thread pool
Current number of tasks awaiting execution
Total number of tasks rejected by this executor
Total number of tasks executed
Current number of threads executing tasks
Total number of tasks executed
Total number of tasks rejected by this working queue.
Current number of threads in the thread pool
Current number of tasks awaiting execution
Total number of tasks rejected by this executor
Total number of tasks executed
Current number of threads executing tasks
Total number of tasks executed
Current number of threads in the thread pool
Current number of tasks awaiting execution
Total number of tasks rejected by this executor
Total number of tasks executed
Current number of inflight discovery interactions
Total number of discovery interactions initiated
Total number of interaction retries performed
Total number of P2P discovery messages received
Total number of P2P discovery messages sent
The number of pending tasks in the Netty boss event loop
The number of pending tasks in the Netty workers event loop
Count of each P2P message received inbound.
Count of each P2P message sent outbound.
The number of pending tasks in the Vertx event loop
Total number of tasks completed by the Vertx worker pool
Total number of tasks rejected by the Vertx worker pool
Total number of tasks submitted to the Vertx worker pool
Total number of peers connected
Total number of peers disconnected
Number of peer requests currently pending because peers are busy
Latency for commits to RocksDB.
Latency for read from RocksDB.
Latency of remove requests from RocksDB.
Estimated database size in bytes
Estimated memory used for RocksDB index and filter blocks in bytes
Number of RocksDB transactions rolled back.
Latency for write to RocksDB.
Time taken to process a JSON-RPC request
Total number of subscriptions
Total number of unsubscriptions
Number of entries process by each chain download pipeline stage
Number of times the chain download pipeline has been restarted
Whether or not the local node has caught up to the best known peer
Internal processing tasks
Count of transactions added to the transaction pool
Total number of duplicate transactions received
Total number of transactions messages skipped by the processor.
Count of transactions removed from the transaction pool
The estimated highest block available
The current height of the canonical chain
The current number of peers connected
The maximum number of peers this node allows to connect
Bytes capacity of a given JVM buffer pool.
Used buffers of a given JVM buffer pool.
Used bytes of a given JVM buffer pool.
The number of classes that are currently loaded in the JVM
The total number of classes that have been loaded since the JVM has started execution
The total number of classes that have been unloaded since the JVM has started execution
Time spent in a given JVM garbage collector in seconds.
Committed (bytes) of a given JVM memory area.
Initial bytes of a given JVM memory area.
Max (bytes) of a given JVM memory area.
Used bytes of a given JVM memory area.
Committed bytes of a given JVM memory pool.
Initial bytes of a given JVM memory pool.
Max bytes of a given JVM memory pool.
Used bytes of a given JVM memory pool.
Current thread count of a JVM
Daemon thread count of a JVM
Cycles of JVM-threads that are in deadlock waiting to acquire object monitors or ownable synchronizers
Cycles of JVM-threads that are in deadlock waiting to acquire object monitors
Peak thread count of a JVM
Started thread count of a JVM
Current count of threads by state
Total user and system CPU time spent in seconds.
Maximum number of open file descriptors.
Number of open file descriptors.
Start time of the process since unix epoch in seconds.
RocksDB statistics (cache,  compression, ...)

[[}]]


# TODO [[{]]
## What's new ConsenSys Quorum 21.1.0 [[{]]
  - advancements for Mainnet development, features to help lower
    costs and increase ease of use
  - New features for GoQuorum and Hyperledger Besu include:
   - Berlin Network Upgrades in preparation for the hardfork
   - Mainnet Launcher  makes it easy to create a config file for an
     Ethereum client at start-up
   - Bonsai Tries a new database format which reduces storage
     requirements and improves performance for access to recent state
   - Node Hibernation to eliminate unnecessary costs when activity is
     reduced for a significant period of time
   - Multi-Tenancy to allow a number of users to use the same Ethereum
     node to connect to the network & thereby reduce costs
   - Learn more about the new features in this release on our blog
[[}]]

## Hyperledger Besu: Understanding and Applying the Options and
    https://consensys.net/blog/quorum/understanding-and-applying-the-options-and-subcommands-with-hyperledger-besu/


[[}]]


[[10_EVM.implementation.besu}]]
