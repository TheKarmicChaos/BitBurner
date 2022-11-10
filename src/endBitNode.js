/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('endBitNode.js'); ns.disableLog("ALL"); ns.clearLog();

	const stayInBitNode = false; // When true, this disables auto-destroying bitnodes. Useful for achievement hunting & saving up for sleeves.
	const bitNodeData = {};
	const ownedSF = ns.singularity.getOwnedSourceFiles();
	const bitNodeOrder =
	[
		1.1, 4.1, 4.2, 1.2, 2.1, 4.3,			// Maxing singularity & unlocking gangs
		10.1, 3.1, 5.1, 8.1, 8.2, 8.3,			// Unlocking corps, sleeves, int, & maxing stock market (I'd highly reccomend doing 3.1 before 10.1)
		3.2, 3.3, 9.1, 9.2, 9.3, 1.3,			// Maxing corps for API, unlocking & maxing hacknet
		12.1, 10.2, 10.3, 2.2, 2.3,	12.2, 		// Recursion lv2, maxing sleeves & crime effectiveness
		7.1, 6.1, 7.2, 7.3, 6.2, 6.3,			// Unlocking & maxing bladeburner							<< YOU ARE HERE <<
		12.3, 12.4, 12.5, 11.1, 11.2, 11.3,		// Recursion lv5, unlocking & maxing job salaries/aug discounts
		5.2, 5.3, 13.1, 13.2, 13.3,				// Maxing hacking mults, then unlocking & maxing stanek's gift

		// 1.0, 2.0, 3.0, 9.0,					// Placeholders for achievement hunting
		12.0									// Infinite Recursion
	];

	// Figure out our next bitnode
	let nextBitNode = GetNextBitNode();
	ns.print("Next node: " + nextBitNode)

	// End the run
	if (!stayInBitNode) {
		if (ns.fileExists("Formulas.exe", "home")) { ns.singularity.destroyW0r1dD43m0n(nextBitNode, 'initRun.js'); }
		else {
			ns.singularity.purchaseProgram("Formulas.exe");
			await ns.sleep(1);
			ns.singularity.destroyW0r1dD43m0n(nextBitNode, 'initRun.js');
		}
	}
	

	function GetNextBitNode() {
		for (var x = 0; x < ownedSF.length; ++x) { // for every owned SF
			var sf = ownedSF[x];
			var sfName = sf.n;
			var sfLv = sf.lvl;

			bitNodeData[sfName] = sfLv; // save the number & lv of this bitnode in dictionary
		}
		var thisBitNode = ns.getPlayer()["bitNodeN"];
		if (!(thisBitNode in bitNodeData)) { // if this bitnode hasn't been got before 
			bitNodeData[thisBitNode] = 1; // save its level as 1
		} else {
			bitNodeData[thisBitNode] += 1; // save its level as n+1
		}

		// Set the maximum number of bn12 loops before we just loop it infinitely. Default 5
		if (12 in bitNodeData) bitNodeData[12] = Math.min(bitNodeData[12], 5);

		for (var x = 0; x < bitNodeOrder.length; ++x) { // iterate through the bitNodeOrder list
			var nextBitNode = Math.floor(bitNodeOrder[x]) // take floor so the decorative decimals are ignored
			// if this nextBitNode has no entry in bitNodeData or has a lvl of 0
			if ( (!(nextBitNode in bitNodeData)) || bitNodeData[nextBitNode] == 0) {
				return nextBitNode;	// it is our next destination, so return it
			} else {
				bitNodeData[nextBitNode] -= 1
			}
		}
	}
}