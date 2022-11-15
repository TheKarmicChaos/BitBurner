import * as tb from "/lib/toolbox";
import Queue from "/lib/classes";
import { getNsDataThroughFile, runCommand, checkNsInstance } from "/lib/helpers";

/** Returns all data in a port without removing it.
 * @param {import("../..").NS} ns
 * @param {number} port - Number of the port you want to peek.
 * - 1: Bitnode & Run Info
 * - 2: Income ($/sec)
 * - 3: Hashes
 * - 6: Run Progress
 * - 7: Gang
 * - 8: Corporation
 * - 9: BladeBurner
 * @param {string} extraFunc - Exta function to parse the data further before returning.
 * - "none": Default value, does nothing.
 * - "sumdict": Use on a dict port to return the sum of all values in the dict.
 * */
export function PeekPort(ns, port, extraFunc = "none") {
	checkNsInstance(ns, 'PeekPort');
	// get total income
	let portData = ns.readPort(port);
	ns.getPortHandle(port).write(portData);
	switch (extraFunc) {
		case "none":
			return portData;
		case "sumdict":
			let total = 0;
			for (let entry in portData) { total += portData[entry]; };
			return total;
	}
}

/** Updates specified data in a port.
 * @param {import("../..").NS} ns
 * @param {number} port - Number of the port you want to peek.
 * - 1: Bitnode & Run Info
 * - 2: Income ($/sec)
 * - 3: Hashes
 * - 6: Run Progress
 * - 7: Gang
 * - 8: Corporation
 * - 9: BladeBurner
 * @param {string} dataStruct - The type of data structure expected to be in this port.
 * - Default value: "array"
 * - Possible values: "dict"
 * @param {any[]} args - An array containing the update data.
 * - "dict": Array contains a list of strings for each key to update in the dict,
 * with each key immediately followed by the value for that key.
 * - Example: ["key1", 10, "key2", true, "key3", "redpill"]
 * */
export function UpdPort(ns, port, dataStruct = "array", args = []) {
	checkNsInstance(ns, 'UpdPort');
	let portData = ns.readPort(port);
	switch (dataStruct) {
		case "arr" || "array":
			try { portData = portData.concat(args); }
			catch (err) { ns.toast("ERROR: UpdPort was passed invalid args array for the specified dataStruct.") };
			break;
		case "dict" || "dictionary":
			try { while (args.length > 0) { portData[args.shift()] = args.shift(); }; }
			catch (err) { ns.toast("ERROR: UpdPort was passed invalid args array for the specified dataStruct.") };
			break;
	}
	ns.getPortHandle(port).write(portData);
	return portData;
}