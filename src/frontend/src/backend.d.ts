import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Visit {
    referrer: string;
    timestamp: Time;
    userAgent: string;
    destinationUrl: string;
}
export type Time = bigint;
export interface backendInterface {
    getAllVisits(): Promise<Array<Visit>>;
    getTotalVisitCount(): Promise<bigint>;
    logVisit(userAgent: string, referrer: string, destinationUrl: string): Promise<void>;
}
