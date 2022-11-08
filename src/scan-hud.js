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
			} else if (nextHTML[nextHTML.length - 1] == '/') {
				curDepth += 1;
				ns.print("   ".repeat(curDepth), "<" + nextHTML)
				curDepth -= 1;
			} else {
				curDepth += 1;
				ns.print("   ".repeat(curDepth), "<" + nextHTML)
				if (nextNonHTML != "") ns.print("INFO ", "   ".repeat(curDepth - 1), nextNonHTML);
			}
		}
	}
	// Depricated by PrintHTML
	function PrintSubElements(parentnode, maxdepth) {
		ns.print("Parent: ", parentnode.nodeName)
		let nodes = parentnode.childNodes;
		ns.print("Children: ")
		for (let node of nodes) {
			if (nodes[nodes.length - 1] === node) { PrintChildren(node, "|-o", "  ", 1, maxdepth); }
			else { PrintChildren(node, "|-o", "| ", 1, maxdepth) }
		}
	}
	// Depricated by PrintHTML
	function PrintChildren(node, myAsciiStr, childAsciiStr, depth, maxdepth) {
		ns.print(`${myAsciiStr}   ${node.nodeName} ${node.id} "${node.textContent}"`)
		if (node.hasChildNodes() && depth + 1 <= maxdepth) {
			for (let subNode of node.childNodes) {
				if (node.childNodes[node.childNodes.length - 1] === subNode) { PrintChildren(subNode, childAsciiStr + "|-o", childAsciiStr + "  ", depth + 1, maxdepth); }
				else { PrintChildren(subNode,  childAsciiStr + "|-o", childAsciiStr + "| ", depth + 1, maxdepth) }
			}
		}
	}
}