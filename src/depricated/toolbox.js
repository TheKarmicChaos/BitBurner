export function GetFromHud(line, side, split, id) {

	const doc = eval("document");

	const hook0 = doc.getElementById('overview-extra-hook-0');
	const hook1 = doc.getElementById('overview-extra-hook-1');
	const hook2 = doc.getElementById('overview-extra-hook-2');

	// retrieve the strings of data already in the hud
	let leftText = hook0.innerText
	let rightText = hook1.innerText

	// split the strings into arrays
	const arrL = leftText.split("\n");
	const arrR = rightText.split("\n");

	var text = arrL[line];
	var textR = arrR[line];
	if (side == 'right') {
		return textR.split(split)[id]
	} else {
		return text.split(split)[id]
	}
};