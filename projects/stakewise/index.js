const ADDRESSES = require('../helper/coreAssets.json')
const sdk = require('@defillama/sdk');
const BigNumber = require('bignumber.js')
const { getLogs } = require('../helper/cache/getLogs')

const wethAddress = ADDRESSES.ethereum.WETH

async function tvl(timestamp, block, _1, { api }) {
  const supply = await sdk.api.erc20.totalSupply({
    target: '0xFe2e637202056d30016725477c5da089Ab0A043A',
    block
  })

  const solosValidators = await getLogs({
    target: '0xEadCBA8BF9ACA93F627F31fB05470F5A0686CEca',
    topic: 'ValidatorRegistered(bytes32,bytes,uint256,address)',
    fromBlock: 11726299,
    api
  })
  const ethOnValidators = BigNumber(solosValidators.length).times(32e18)
  const vaults = await getLogs({
    target: '0x3a0008a588772446f6e656133c2d5029cc4fc20e',
    topic: 'VaultAdded(address,address)',
    fromBlock: 18470078,
    api
  })
  const assets = await api.multiCall({
    calls: vaults.map(v=>({target:"0x"+v.topics[2].slice(26)})),
    abi: "uint256:totalAssets"
  })

  return {
    [wethAddress]: ethOnValidators.plus(supply.output).plus(assets.reduce((sum, b)=>sum.plus(b), BigNumber(0))).toFixed(0)
  }
}

async function xdaiTvl(timestamp, ethBlock, { xdai: block }) {
  const chain = "xdai"
  const supply = await sdk.api.erc20.totalSupply({
    target: '0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445',
    block,
    chain
  })

  return {
    [ADDRESSES.ethereum.GNO]: supply.output
  }
}



module.exports = {
  methodology: 'Counts ETH staked',
  ethereum: {
    tvl,
  },
  xdai:{
    tvl: xdaiTvl
  }
}
