/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.tail('scan-hud.js'); ns.disableLog("ALL"); ns.clearLog();
	await ns.sleep(10);

	const d = eval("document")
	const ovv = d.getElementsByClassName('MuiPaper-root')[0];
	const ovvHeader = ovv.childNodes[0].firstChild.firstChild.firstChild;
	const ovvTableCont = ovv.childNodes[1].firstChild.firstChild.firstChild.firstChild;


	PrintHTML(ovvTableCont);


	function PrintHTML(parentnode) {
		ns.print("Parent: ", parentnode.nodeName)
		ns.print("HTML: ");
		let fullHTML = parentnode.innerHTML;
		let fullSplitL = fullHTML.split("<")
		let remainingHTML = fullHTML
		let elList = []
		// break down HTML into array of <elements> and innerText.
		for (let n = 1; n < fullSplitL.length; n++) {
			let thisEl = `<${fullSplitL[n].split(">")[0]}>`;
			let nextText = fullSplitL[n].split(">")[1];
			elList.push(thisEl)
			if (nextText != "") elList.push(nextText);
		}
		let nextTreeSeg = ``
		let nextTextSeg = `INFO`
		let curDepth = -1;
		for (let n = 0; n < elList.length; n++) {
			let el = elList[n]
			let elTag = elList[n].split(" ")[0]
			let nextEl = elList[Math.min(n+1, elList.length - 1)]
			if (["<strong>", "</strong>"].includes(el) || el[0] != "<") {
				if (nextTextSeg == `INFO`) nextTextSeg += `${"   ".repeat(curDepth)}`;
				nextTextSeg += `${el}`;
			} else if (el.substring(0,3) == "<br") {
				if (nextTextSeg == `INFO`) nextTextSeg += `${"   ".repeat(curDepth)}`;
				nextTextSeg += `${el}\n`
			} else {
				if (nextTextSeg != `INFO`) {
					ns.print(nextTreeSeg); nextTreeSeg = '';
					ns.print(nextTextSeg); nextTextSeg = 'INFO';
				}
				if (el.substring(0,2) == '</') {
					nextTreeSeg += `${"   ".repeat(curDepth)}${el}\n`
					curDepth -= 1;
				} else if (el.substring(el.length - 2) == '/>') {
					curDepth += 1;
					nextTreeSeg += `${"   ".repeat(curDepth)}${el}\n`;
					curDepth -= 1;
				} else {
					curDepth += 1;
					nextTreeSeg += `${"   ".repeat(curDepth)}${el}`;
					if (nextEl == `</${elTag.substring(1)}>`) {
						nextTreeSeg += `   ${nextEl}\n`;
						curDepth -= 1;
						n++;
					} else nextTreeSeg += `\n`;
				}
			}
		}
		ns.print(nextTreeSeg);
	}
}