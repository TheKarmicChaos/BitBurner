import * as nstb from './lib/nstools';
import * as tb from './lib/toolbox';

/** @param {import("../").NS} ns */
export async function main(ns) {
	ns.tail('test.js');
	ns.clearLog();
	const d = eval("document");
	const GLOBAL_VARS = nstb.getGlobals(ns);

	

	ns.print("INFO \n",



	)
	// Commonly used print statements

	//ns.print(ns.singularity.getCurrentWork())
	//ns.print(tb.RecursivePrint(ns.getPlayer()))
	//ns.print(tb.RecursivePrint(ns.sleeve.getInformation(5)))
	//ns.print(tb.RecursivePrint(ns.getBitNodeMultipliers()))
	//ns.print(tb.RecursivePrint(ns.gang.getGangInformation()))
	//ns.print(tb.RecursivePrint(ns.corporation.getCorporation()))
	
}