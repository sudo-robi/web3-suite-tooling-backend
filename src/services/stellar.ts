import * as StellarSdk from '@stellar/stellar-sdk';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

const server = new StellarSdk.rpc.Server(config.stellar.rpcUrl);

export function getServer() {
  return server;
}

export function getNetworkPassphrase(): string {
  return config.stellar.passphrase;
}

export async function invokeContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sourceKey?: string
): Promise<StellarSdk.rpc.Api.SimulateTransactionResponse> {
  try {
    const contract = new StellarSdk.Contract(contractId);

    const transaction = new StellarSdk.TransactionBuilder(
      await server.getAccount(sourceKey || config.adminSecretKey),
      { fee: StellarSdk.BASE_FEE, networkPassphrase: config.stellar.passphrase }
    )
      .addOperation(contract.call(method, ...args))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    return simulated;
  } catch (error) {
    logger.error(`Contract invocation failed: ${method}`, { error, contractId });
    throw error;
  }
}

export function scValToNative<T>(val: StellarSdk.xdr.ScVal): T {
  return StellarSdk.scValToNative(val) as T;
}

export function addressToScVal(address: string): StellarSdk.xdr.ScVal {
  return StellarSdk.Address.addressToScVal(address);
}

export function u64ToScVal(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: 'u64' });
}

export function i128ToScVal(value: string | number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value.toString(), { type: 'i128' });
}

export function symbolToScVal(value: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: 'symbol' });
}

export function stringToScVal(value: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: 'string' });
}
