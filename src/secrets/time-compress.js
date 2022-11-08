/** @param {import("../../").NS} ns */
export async function main(ns) {
    window.performance.now = function() { return 0; };
}