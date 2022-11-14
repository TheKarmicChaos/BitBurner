import * as nstb from './lib/nstools';
import * as tb from './lib/toolbox';

/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.tail('global-display.js');
	ns.disableLog("ALL");
	
	while (true) {
		ns.clearLog();
		ns.print(tb.RecursivePrint(nstb.getGlobals(ns)));
		await ns.sleep(10);
	}
}