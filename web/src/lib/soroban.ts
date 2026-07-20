/** @deprecated Prefer `@/lib/contract-client` — kept for existing imports. */
export {
  DoqtriRegistry,
  type ChainDocument,
  type ChainNode,
} from "@/lib/contract-client";

import { DoqtriRegistry } from "@/lib/contract-client";

export const getDocument = DoqtriRegistry.getDocument;
export const getNode = DoqtriRegistry.getNode;
export const registerDocument = DoqtriRegistry.registerDocument;
export const updateDocument = DoqtriRegistry.updateDocument;
export const setNodeStatus = DoqtriRegistry.setNodeStatus;
