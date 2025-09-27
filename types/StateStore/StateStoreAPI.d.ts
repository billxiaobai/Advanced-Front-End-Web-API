import StoreModule = require('./StoreModule');

export function createStore(name: string, initial?: Record<string, any>): StoreModule;
export function getStore(name: string): StoreModule | null;
export function hasStore(name: string): boolean;
export function removeStore(name: string): boolean;
export function listStores(): string[];
