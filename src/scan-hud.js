/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.tail('scan-hud.js'); ns.disableLog("ALL"); ns.clearLog();
	await ns.sleep(10);

	const d = eval("document")
	const ovv = d.getElementsByClassName('MuiPaper-root')[0];
	const ovvHeader = ovv.childNodes[0].firstChild.firstChild.firstChild;
	const ovvTableCont = ovv.childNodes[1].firstChild.firstChild.firstChild;


	PrintHTML(ovvTableCont);


	function PrintHTML(parentnode) {
		ns.print("Parent: ", parentnode.nodeName)
		let fullHTML = parentnode.innerHTML;
		let curDepth = -1;
		ns.print("HTML: ")
		for (let n = 1; n < fullHTML.split("<").length; n++) {
			let nextHTML = fullHTML.split("<")[n]
			let nextNonHTML = nextHTML.split(">")[1]
			if (nextNonHTML != "") nextHTML = nextHTML.split(">")[0] + ">"
			if (nextHTML[0] == '/') {
				ns.print("   ".repeat(curDepth), "<" + nextHTML)
				curDepth -= 1;
			} else if (nextHTML[nextHTML.length - 1] == '/' || nextHTML.substring(0,2) == "br") {
				curDepth += 1;
				ns.print("   ".repeat(curDepth), "<" + nextHTML)
				curDepth -= 1;
			} else {
				curDepth += 1;
				ns.print("   ".repeat(curDepth), "<" + nextHTML)
				if (nextNonHTML != "") ns.print("INFO ", "   ".repeat(curDepth - 1), nextNonHTML);
			}
		}
		ns.print(fullTree);
	}
}