const repository = window.DREAM_SKIN_REPOSITORY;
document.querySelector("#github-link").href = repository;
const toast = document.querySelector(".toast");
let timer;

async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const area = document.createElement("textarea");
    area.value = text; document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
  }
  toast.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

document.querySelector("#install").addEventListener("click", () => copy(`请安装这个 Skill，安装完成后告诉我：${repository}/tree/main/skills/dream-skin-studio`));
document.querySelector("#custom").addEventListener("click", () => copy("我要一套温暖、安静的原创皮肤和配套桌宠，参考这个链接：<粘贴链接>，请直接检查、生成并换好。"));
for (const card of document.querySelectorAll(".card")) {
  card.querySelector("button").addEventListener("click", () => copy(`请用 Dream Skin Studio 给我换成“${card.dataset.name}”，皮肤和桌宠一起换好。`));
}
