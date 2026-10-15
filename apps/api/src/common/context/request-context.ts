import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  userId: string;
  tenantId: string;
  activeCondominiumId: string | null;
  roles: string[];
  permissions: Set<string>;
  email: string;
  isSuperAdmin: boolean;
  requestId: string;
  ip?: string;
  userAgent?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const RequestContextStore = {
  enterWith(context: RequestContext): void {
    asyncLocalStorage.enterWith(context);
  },
  run<R>(context: RequestContext, fn: () => R): R {
    return asyncLocalStorage.run(context, fn);
  },
  get(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
  },
  getOrThrow(): RequestContext {
    const ctx = asyncLocalStorage.getStore();
    if (!ctx) {
      throw new Error("RequestContext is not available in current execution context");
    }
    return ctx;
  },
};
