const lang = navigator.language || "en";

let boxOnLeft = true;

const textMap = {
	zh: {
		label: "获取中...",
		close: "关闭",
		toggle: "切换位置",
	},
	en: {
		label: "Fetching...",
		close: "Close",
		toggle: "Switch position",
	},
	ja: {
		label: "取得中...",
		close: "閉じる",
		toggle: "位置切替",
	},
};

function getLangText() {
	if (lang.startsWith("zh")) return textMap.zh;
	if (lang.startsWith("ja")) return textMap.ja;
	return textMap.en;
}

const TEXT = getLangText();

function updatePageWithIP(ip) {
	const ipLabel = document.getElementById("ip-label");
	ipLabel.textContent = ip;
}

function getEffectiveBackgroundColor(element) {
	while (element) {
		const color = getComputedStyle(element).backgroundColor;
		if (color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent") {
			return color;
		}
		element = element.parentElement;
	}
	return "rgb(34, 34, 34)"; // default color
}

function setColorAlpha(color, newAlpha) {
	const match = color.match(
		/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
	);

	if (match) {
		const r = parseInt(match[1]);
		const g = parseInt(match[2]);
		const b = parseInt(match[3]);

		return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
	} else {
		throw new Error(`[show-remote-ip] Wrong format color: ${color}`);
	}
}

function invertColor(rgbStr) {
	const result = rgbStr.match(/\d+/g);
	if (!result || result.length < 3) return null;

	const r = 255 - parseInt(result[0]);
	const g = 255 - parseInt(result[1]);
	const b = 255 - parseInt(result[2]);

	return `rgb(${r}, ${g}, ${b})`;
}

function drawBox() {
	const bgColor = setColorAlpha(
		getEffectiveBackgroundColor(document.body),
		0.4,
	);
	const fgColor = invertColor(bgColor);

	const box = document.createElement("div");
	box.id = "show-remote-ip";
	box.innerHTML = `
		<span id="ip-label">${TEXT.label}</span>
		<button id="ip-toggle">⇄</button>
		<button id="ip-close">×</button>
	`;
	box.style.setProperty("--bg-color", bgColor);
	box.style.setProperty("--fg-color", fgColor);

	document.body.appendChild(box);

	document.getElementById("ip-toggle").onclick = () => {
		boxOnLeft = !boxOnLeft;
		box.style.left = boxOnLeft ? "10px" : "unset";
		box.style.right = boxOnLeft ? "unset" : "10px";
	};

	document.getElementById("ip-close").onclick = () => box.remove();
}

function sendMessageSafely(message, callback) {
	try {
		chrome.runtime.sendMessage(message, (response) => {
			if (chrome.runtime.lastError) {
				console.error(
					"[show-remote-ip] Message sending failed:",
					chrome.runtime.lastError.message,
				);
				if (callback) callback(null);
			} else {
				if (callback) callback(response);
			}
		});
	} catch (error) {
		console.error("[show-remote-ip] Failed to send message:", error);
		if (callback) callback(null);
	}
}

function requestCurrentIP() {
	sendMessageSafely({ action: "getIP" }, (response) => {
		const ip = response?.ip;
		if (ip) {
			updatePageWithIP(ip);
		} else {
			setTimeout(requestCurrentIP, 500);
		}
	});
}

async function start() {
	drawBox();
	requestCurrentIP();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", start);
} else {
	setTimeout(start, 100);
}
