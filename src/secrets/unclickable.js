/** @param {import("../../").NS} ns */
export async function main(ns) {
	ns.tail('secrets/unclickable.js'); ns.disableLog("ALL"); ns.clearLog();

	const d = eval("document");

    d.getElementById('unclickable').style = "display: block;position: absolute;top: 50%;left: 50%;width: 100px;height: 100px;z-index: 10000;background: red;";
    d.getElementById('unclickable').parentNode.addEventListener('click', () => {d.getElementById('unclickable').style = "display: none; visibility: hidden;";}, true);

}
