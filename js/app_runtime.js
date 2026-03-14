// let application = document.getElementsByClassName("application");
// for (let app = 0; app < application.length; app++) {
// 	application[app].addEventListener("click", function () {
// 		console.log(this.textContent);
// 	});
// }

// var iconSrc;
// var el = document.getElementsByClassName("application");
// for (var i = 0; i < el.length; i++) {
//     el[i].addEventListener("click", function () {
//         iconSrc = this.src;
//         console.log(iconSrc);
//     });
// }

// use for in development feature

function opencmd() {
	const tabWindow = document.createElement("div");
	const titleBar = document.createElement("div");
	const titleTab = document.createElement("div");
	tabWindow.classList.add("tab-window");
	titleBar.classList.add("titlebar");
	titleTab.classList.add("titletab");
	body.appendChild(tabWindow);
	tabWindow.appendChild(titleBar);
	titleBar.appendChild(titleTab);
	titleTab.textContent = "Command Prompt";
	// const t = document.createElement("div");
	// const tabWindow = document.createElement("div");
	// const tabWindow = document.createElement("div");
}