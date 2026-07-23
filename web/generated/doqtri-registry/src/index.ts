import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  1: {message:"DocumentAlreadyExists"},
  2: {message:"DocumentNotFound"},
  3: {message:"NodeNotFound"}
}

export type DataKey = {tag: "Doc", values: readonly [string]} | {tag: "Node", values: readonly [string, string]};


/**
 * An anchored document: who owns it, its latest content hash, and version.
 */
export interface Document {
  content_hash: Buffer;
  node_count: u32;
  owner: string;
  updated_at: u64;
  version: u32;
}


/**
 * Build-status record for a single mindmap node.
 */
export interface NodeRecord {
  artifact_ref: string;
  status: NodeStatus;
  tool: string;
  updated_at: u64;
}

/**
 * Lifecycle of a mindmap node, from plan to verified deployment.
 */
export type NodeStatus = {tag: "Planned", values: void} | {tag: "Building", values: void} | {tag: "Built", values: void} | {tag: "Verified", values: void};

export interface Client {
  /**
   * Construct and simulate a get_node transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fetch a node's build-status record.
   */
  get_node: ({doc_id, node_id}: {doc_id: string, node_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<NodeRecord>>>

  /**
   * Construct and simulate a get_document transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fetch a document's anchored state.
   */
  get_document: ({doc_id}: {doc_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Document>>>

  /**
   * Construct and simulate a set_node_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record or update the build status of a mindmap node.
   * `tool` is the builder used (e.g. "n8n"); `artifact_ref` points to the
   * built artifact (workflow ID, URL, or hash). Owner-only.
   */
  set_node_status: ({doc_id, node_id, status, tool, artifact_ref}: {doc_id: string, node_id: string, status: NodeStatus, tool: string, artifact_ref: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_document transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anchor a new content hash after a semantic change in the source doc.
   * Only the document owner may call. Returns the new version number.
   */
  update_document: ({doc_id, new_hash}: {doc_id: string, new_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a register_document transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anchor a new document. Fails if `doc_id` is already registered.
   * Returns the initial version (always 1).
   */
  register_document: ({owner, doc_id, content_hash}: {owner: string, doc_id: string, content_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAAVRG9jdW1lbnRBbHJlYWR5RXhpc3RzAAAAAAAAAQAAAAAAAAAQRG9jdW1lbnROb3RGb3VuZAAAAAIAAAAAAAAADE5vZGVOb3RGb3VuZAAAAAM=",
        "AAAAAAAAACNGZXRjaCBhIG5vZGUncyBidWlsZC1zdGF0dXMgcmVjb3JkLgAAAAAIZ2V0X25vZGUAAAACAAAAAAAAAAZkb2NfaWQAAAAAABAAAAAAAAAAB25vZGVfaWQAAAAAEAAAAAEAAAPpAAAH0AAAAApOb2RlUmVjb3JkAAAAAAAD",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAAA0RvYwAAAAABAAAAEAAAAAEAAAAAAAAABE5vZGUAAAACAAAAEAAAABA=",
        "AAAAAQAAAEhBbiBhbmNob3JlZCBkb2N1bWVudDogd2hvIG93bnMgaXQsIGl0cyBsYXRlc3QgY29udGVudCBoYXNoLCBhbmQgdmVyc2lvbi4AAAAAAAAACERvY3VtZW50AAAABQAAAAAAAAAMY29udGVudF9oYXNoAAAD7gAAACAAAAAAAAAACm5vZGVfY291bnQAAAAAAAQAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAKdXBkYXRlZF9hdAAAAAAABgAAAAAAAAAHdmVyc2lvbgAAAAAE",
        "AAAAAAAAACJGZXRjaCBhIGRvY3VtZW50J3MgYW5jaG9yZWQgc3RhdGUuAAAAAAAMZ2V0X2RvY3VtZW50AAAAAQAAAAAAAAAGZG9jX2lkAAAAAAAQAAAAAQAAA+kAAAfQAAAACERvY3VtZW50AAAAAw==",
        "AAAAAQAAAC5CdWlsZC1zdGF0dXMgcmVjb3JkIGZvciBhIHNpbmdsZSBtaW5kbWFwIG5vZGUuAAAAAAAAAAAACk5vZGVSZWNvcmQAAAAAAAQAAAAAAAAADGFydGlmYWN0X3JlZgAAABAAAAAAAAAABnN0YXR1cwAAAAAH0AAAAApOb2RlU3RhdHVzAAAAAAAAAAAABHRvb2wAAAAQAAAAAAAAAAp1cGRhdGVkX2F0AAAAAAAG",
        "AAAAAgAAAD5MaWZlY3ljbGUgb2YgYSBtaW5kbWFwIG5vZGUsIGZyb20gcGxhbiB0byB2ZXJpZmllZCBkZXBsb3ltZW50LgAAAAAAAAAAAApOb2RlU3RhdHVzAAAAAAAEAAAAAAAAAAAAAAAHUGxhbm5lZAAAAAAAAAAAAAAAAAhCdWlsZGluZwAAAAAAAAAAAAAABUJ1aWx0AAAAAAAAAAAAAAAAAAAIVmVyaWZpZWQ=",
        "AAAAAAAAALJSZWNvcmQgb3IgdXBkYXRlIHRoZSBidWlsZCBzdGF0dXMgb2YgYSBtaW5kbWFwIG5vZGUuCmB0b29sYCBpcyB0aGUgYnVpbGRlciB1c2VkIChlLmcuICJuOG4iKTsgYGFydGlmYWN0X3JlZmAgcG9pbnRzIHRvIHRoZQpidWlsdCBhcnRpZmFjdCAod29ya2Zsb3cgSUQsIFVSTCwgb3IgaGFzaCkuIE93bmVyLW9ubHkuAAAAAAAPc2V0X25vZGVfc3RhdHVzAAAAAAUAAAAAAAAABmRvY19pZAAAAAAAEAAAAAAAAAAHbm9kZV9pZAAAAAAQAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAKTm9kZVN0YXR1cwAAAAAAAAAAAAR0b29sAAAAEAAAAAAAAAAMYXJ0aWZhY3RfcmVmAAAAEAAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAAIZBbmNob3IgYSBuZXcgY29udGVudCBoYXNoIGFmdGVyIGEgc2VtYW50aWMgY2hhbmdlIGluIHRoZSBzb3VyY2UgZG9jLgpPbmx5IHRoZSBkb2N1bWVudCBvd25lciBtYXkgY2FsbC4gUmV0dXJucyB0aGUgbmV3IHZlcnNpb24gbnVtYmVyLgAAAAAAD3VwZGF0ZV9kb2N1bWVudAAAAAACAAAAAAAAAAZkb2NfaWQAAAAAABAAAAAAAAAACG5ld19oYXNoAAAD7gAAACAAAAABAAAD6QAAAAQAAAAD",
        "AAAAAAAAAGdBbmNob3IgYSBuZXcgZG9jdW1lbnQuIEZhaWxzIGlmIGBkb2NfaWRgIGlzIGFscmVhZHkgcmVnaXN0ZXJlZC4KUmV0dXJucyB0aGUgaW5pdGlhbCB2ZXJzaW9uIChhbHdheXMgMSkuAAAAABFyZWdpc3Rlcl9kb2N1bWVudAAAAAAAAAMAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAGZG9jX2lkAAAAAAAQAAAAAAAAAAxjb250ZW50X2hhc2gAAAPuAAAAIAAAAAEAAAPpAAAABAAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_node: this.txFromJSON<Result<NodeRecord>>,
        get_document: this.txFromJSON<Result<Document>>,
        set_node_status: this.txFromJSON<Result<void>>,
        update_document: this.txFromJSON<Result<u32>>,
        register_document: this.txFromJSON<Result<u32>>
  }
}