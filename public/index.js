"use strict";

function checkBrowsers() {
  if (navigator.userAgent.indexOf("MSIE") !== -1 || navigator.appVersion.indexOf("Trident/") > 0) window.location = "/browsers.html";

  if (window.navigator.standalone) document.documentElement.setAttribute("class", document.documentElement.getAttribute("class") + " standalone");
}

function setupIcons() {
  const favicon = document.getElementById("favicon");
  const favicon_16_16 = document.querySelector("link[rel='icon'][sizes='16x16']");
  const favicon_dark_16_16 = document.querySelector("link[id='favicon-dark-16x16'][rel='icon'][sizes='16x16']");
  const favicon_32_32 = document.querySelector("link[rel='icon'][sizes='32x32']");
  const favicon_dark_32_32 = document.querySelector("link[id='favicon-dark-32x32'][rel='icon'][sizes='32x32']");
  const favicon_48_48 = document.querySelector("link[rel='icon'][sizes='48x48']");
  const favicon_dark_48_48 = document.querySelector("link[id='favicon-dark-48x48'][rel='icon'][sizes='48x48']");

  function setLight() {
    if (favicon) favicon.href = "./favicons/favicon.ico";

    if (favicon_16_16) document.head.append(favicon_16_16);
    if (favicon_32_32) document.head.append(favicon_32_32);
    if (favicon_48_48) document.head.append(favicon_48_48);

    if (favicon_dark_16_16) favicon_dark_16_16.remove();
    if (favicon_dark_32_32) favicon_dark_32_32.remove();
    if (favicon_dark_48_48) favicon_dark_48_48.remove();
  }

  function setDark() {
    if (favicon) favicon.href = "./favicons/favicon-dark.ico";

    if (favicon_16_16) favicon_16_16.remove();
    if (favicon_32_32) favicon_32_32.remove();
    if (favicon_48_48) favicon_48_48.remove();

    if (favicon_dark_16_16) document.head.append(favicon_dark_16_16);
    if (favicon_dark_32_32) document.head.append(favicon_dark_32_32);
    if (favicon_dark_48_48) document.head.append(favicon_dark_48_48);
  }

  const matcher = window.matchMedia("(prefers-color-scheme:dark)");

  function onUpdate() {
    if (matcher.matches) {
      setDark();
    } else {
      setLight();
    }
  }

  matcher.addListener(onUpdate);
  onUpdate();
}

function setupPWA() {
  // eslint-disable-next-line
  (function () {var f=/iPhone/i,j=/iPod/i,p=/iPad/i,g=/\bAndroid(?:.+)Mobile\b/i,i=/Android/i,d=/\bAndroid(?:.+)SD4930UR\b/i,e=/\bAndroid(?:.+)(?:KF[A-Z]{2,4})\b/i,c=/Windows Phone/i,h=/\bWindows(?:.+)ARM\b/i,k=/BlackBerry/i,l=/BB10/i,m=/Opera Mini/i,n=/\b(CriOS|Chrome)(?:.+)Mobile/i,o=/Mobile(?:.+)Firefox\b/i;function b($,a){return $.test(a)}function a($){var a=($=$||("undefined"!=typeof navigator?navigator.userAgent:"")).split("[FBAN");void 0!==a[1]&&($=a[0]),void 0!==(a=$.split("Twitter"))[1]&&($=a[0]);var r={apple:{phone:b(f,$)&&!b(c,$),ipod:b(j,$),tablet:!b(f,$)&&b(p,$)&&!b(c,$),device:(b(f,$)||b(j,$)||b(p,$))&&!b(c,$)},amazon:{phone:b(d,$),tablet:!b(d,$)&&b(e,$),device:b(d,$)||b(e,$)},android:{phone:!b(c,$)&&b(d,$)||!b(c,$)&&b(g,$),tablet:!b(c,$)&&!b(d,$)&&!b(g,$)&&(b(e,$)||b(i,$)),device:!b(c,$)&&(b(d,$)||b(e,$)||b(g,$)||b(i,$))||b(/\bokhttp\b/i,$)},windows:{phone:b(c,$),tablet:b(h,$),device:b(c,$)||b(h,$)},other:{blackberry:b(k,$),blackberry10:b(l,$),opera:b(m,$),firefox:b(o,$),chrome:b(n,$),device:b(k,$)||b(l,$)||b(m,$)||b(o,$)||b(n,$)},any:!1,phone:!1,tablet:!1};return r.any=r.apple.device||r.android.device||r.windows.device||r.other.device,r.phone=r.apple.phone||r.android.phone||r.windows.phone,r.tablet=r.apple.tablet||r.android.tablet||r.windows.tablet,r}window.isMobile=a();})();

  if (window.isMobile.apple.phone || window.isMobile.android.phone) {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
    });
  }
}

function setup() {
  checkBrowsers();

  setupIcons();
  setupPWA();
}

setup();
