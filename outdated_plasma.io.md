# Scalability L2 Plasma.io [[{scalability.layer2,layer2.plasma,01_PM.TODO]]
@[https://plasma.io/]
Authors: Joseph Poon and Vitalik Buterin
- framework for incentivized and enforced execution of smart contracts which
  is scalable to a significant amount of state updates per second (potentially
  billions) enabling the blockchain to be able to represent a significant
  amount of decentralized financial applications worldwide. These smart
  contracts are incentivized to continue operation autonomously via network
  transaction fees, which is ultimately reliant upon the underlying blockchain
  (e.g. Ethereum) to enforce transactional state transitions.

https://plasma.io/plasma.pdf
The orchestrated transaction processing paradigm using the interplay between
rootchains, plasma chains, and child chains through a combination of fraud-
proof mechanism designs and fidelity bond incentive structures help satisfy
dynamics between the block-withholding and mass withdrawal surfaces. It also
allows for further cryptoeconomic structures to be filled using mechanisms
from systems like Casper or Truebit for mirroring concepts used in erasure
coding in terms of the data availability problem that is prevalent in the
space. For a multichain architecture, Ethereum would be able to combine the
database coordination and throughput capabilities of a distributed database
system with the public chain compatible capabilities of an actual blockchain.

https://media.consensys.net/blockchain-vs-distributed-ledger-technologies-1e0289a87b16
Through technical evaluations of tools like Plasma and formats of obtaining
consensus in Casper, it is apparent that database management tools like
MapReduce and Abstract Rewrite Systems will be implemented in Ethereum. In
Plasma, MapReduce is an integral part of assembling the coordination of an
account based system and a bitmap-UTXO commitment structure of a multichain
setup.
  ...
Plasma shares quite a bit of influence from a heavily cryptoeconomic
incentive structure focused platform called Truebit which was designed to
increase the offchain computational capabilities of the Ethereum network. By
architecting the Truebit system around a verification game in which Solvers
of the overall consensus mechanism can be challenged by Verifiers which
obtain a reward if they identify a nefarious counterparty, an internal
cryptoeconomic ?checks and balances? of the system is created to incentive a
dominant strategy of behaving fairly. As Plasma through the influence of
TrueBit is focused on creating a multichain interoperability network, the
internal enforcement of the system is paramount toward achieving information
and consensus fidelity.

## Plasma Chamber Framework: Dev framework guaranteing security/scalability/usability using Plasma.
@[https://github.com/cryptoeconomicslab/plasma-chamber]
   https://www.cryptoeconomicslab.com/

## Minimal Viable Plasma
@[https://ethresear.ch/t/minimal-viable-plasma/426]

## Lead DAO: https://leapdao.org/: More Viable Plasma design with SC like functionality.
[[}]]
