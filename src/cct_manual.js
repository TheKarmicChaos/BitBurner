import * as nstb from "./lib/nstools";

/** @param {import("../").NS} ns */
export async function main(ns) {
	ns.tail('cct_manual.js'); ns.disableLog("ALL"); ns.clearLog();

	let allServs = nstb.ScanAll(ns);

	function FindContracts() {
		let cctLocations = {}
		for (const serv of allServs) {
			var docs = ns.ls(serv);
			for (const doc of docs) {
				if (doc.split(".")[1] == 'cct') {
					if (cctLocations[serv] != null) {
						cctLocations[serv].push(doc)
					} else {
						cctLocations[serv] = [doc]
					}
				}
			}
		}
		return cctLocations
	}
	
	var servList = FindContracts()

	ns.clearLog();
	ns.print(servList);
	for (let serv in servList) {
		ns.print(serv + " Contracts:")
		for (let cct of servList[serv]) {
			ns.print(cct + "  -  " + ns.codingcontract.getContractType(cct, serv))
			ns.print(ns.codingcontract.getData(cct, serv))
			ns.print(ns.codingcontract.getDescription(cct, serv))
		}
	}

	/*function WaysToSum(num) {
		var total;
		if (num <= 3) {
			total = num;
		} else {
			total = 3
			for (var y = 3; y < num; ++y) {
				var delta;
				if (y % 2 == 0) { // y is even
					delta = y - 2;
				} else { delta = y - 1 } // y is odd
				total += delta;
			}
		}
		return total - 1
	}

	ns.print(WaysToSum(7))*/

}