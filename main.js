// 插入侧栏与页面
const extensionShopPage = ExtensionFunctions.insertNavigationItem({
    pageId: "extensionShopPage",
    icon: "EA44",
    text: "商店"
});
ExtensionFunctions.insertStyle(`
    #extensionShopPage #extensionShopContainer{
        position: absolute;
        z-index: 1;
        padding: 70px 27.5px 100px 27.5px;
        padding-top: 90px !important;
        width: 100%;
        height: 100%;
        overflow-y: scroll;
    }
    #extensionShopPage #extensionShopContainer>div {
        background: white;
        width: 100%;
        border-radius: 5px;
        margin-bottom: 5px;
        padding: 10px 15px;
        display: flex;
        align-items: center;
    }
    #extensionShopPage #extensionShopContainer>div section {
        width: 100%;
        margin-right: 10px;
    }
    #extensionShopPage #extensionShopContainer>div section div {
        font-size: 1em;
    }
    #extensionShopPage #extensionShopContainer>div section span {
        display: block;
        font-size: .9em;
        opacity: .8;
        word-break: break-all;
        line-height: 1.1em;
        margin-top: 3px;
    }
    #extensionShopPage #extensionShopContainer button {
        white-space: nowrap;
    }
    #extensionShopPage #extensionShopHeader {
        display: flex;
        align-items: center;
    }
    #extensionShopPage #extensionSearchForm {
        font-size: medium;
        max-width: 230px;
        margin-left: auto;
        margin-top: 6px;
        margin-bottom: 0;
        display: flex;
        flex-direction: row;
        gap: 5px;
    }
    #extensionShopPage #extensionSearchInput {
        font-size: 12px;
        margin: 0;
        padding: 5px;
    }
    #extensionShopPage #extensionSearchButton {
        width: 32px;
        height: 26px;
        padding: 0px;
        font-size: 16px;
        padding-left: 5px;
    }
`);
extensionShopPage.pageDiv.classList.add("page");
extensionShopPage.pageDiv.innerHTML = `<div class="header" id="extensionShopHeader">
    <i></i> 扩展商店
    <form class="inputGroup" id="extensionSearchForm">
        <input id="extensionSearchInput" placeholder="搜索扩展" spellcheck="false">
        <button id="extensionSearchButton"><i></i></button>
    </form>
</div>
<div>
<div id="extensionShopContainer">列表加载中...</div>`;

extensionShopPage.navbarDiv.addEventListener("click", (event) => {
    loadStoreData();
});

async function downloadAndInstallPlugin(url, buttonElement) {
    const tempDir = require('os').tmpdir();
    const filename = url.substring(url.lastIndexOf('/') + 1);
    const filePath = path.join(tempDir, filename);

    const xhr = new XMLHttpRequest();

    xhr.onprogress = function (event) {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`下载进度: ${percentComplete.toFixed(2)}%`);
        }
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const fileReader = new FileReader();

            fileReader.onloadend = function () {
                const buffer = Buffer.from(fileReader.result);
                fs.writeFile(filePath, buffer, async function (err) {
                    if (err) {
                        console.error(`写入文件失败: ${err}`);
                    } else {
                        console.log(`文件已保存至: ${filePath}`);
                        const zipFileBuffer = await fs.promises.readFile(filePath);
                        const file = new File([zipFileBuffer], path.basename(filePath), { type: 'application/zip' });
                        ExtensionRuntime.install(file);
                    }
                });
            };

            fileReader.readAsArrayBuffer(blob); // Ensure xhr.response is a Blob
        } else {
            console.error(`下载失败，状态码: ${xhr.status}`);
        }
    };

    xhr.onerror = function () {
        console.error(`下载出错`);
    };
    xhr.open('GET', url, true);
    xhr.responseType = 'blob'; // Ensure xhr.responseType is set to 'blob'
    xhr.send();
}
async function fetchPluginList() {
    const response = await fetch('https://mirror.ghproxy.com/https://raw.githubusercontent.com/PYLXU/pluginStore/main/pluginList.json');
    if (!response.ok) {
        throw new Error(`插件列表载入失败: ${response.status} ${response.statusText}（请确保您能够连接到Github）`);
    }
    return await response.json();
}

async function fetchLatestRelease(repoName) {
    const [owner, repo] = repoName.split('/');
    const url = `https://proxies.3r60.top/https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`无法获取插件构建，存储库： ${repoName}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function fetchManifest(repoName, tag) {
    const url = `https://mirror.ghproxy.com/https://raw.githubusercontent.com/${repoName}/${tag}/manifest.json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`清单获取失败|${repoName}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function fetchPackageJson(repoName, tag) {
    const url = `https://mirror.ghproxy.com/https://raw.githubusercontent.com/${repoName}/${tag}/package.json`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`清单获取失败|${repoName}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

function insertAfter(newElement, targetElement) {
    var parent = targetElement.parentNode;
    if (parent.lastChild == targetElement) {
        parent.appendChild(newElement);
    } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

async function loadStoreData() {
    const extensionContainer = document.getElementById("extensionShopContainer");
    extensionContainer.innerHTML = `<div style="gap: 10px;">
    <span>扩展分类</span>
    <button class="extensionCategoryButton" data-category="扩展">全部</button>
	<button class="extensionCategoryButton sub" data-category="音源">音源</button>
	<button class="extensionCategoryButton sub" data-category="门户">门户</button>
	<button class="extensionCategoryButton sub" data-category="功能">功能</button>
	<button class="extensionCategoryButton sub" data-category="美化">美化</button>
	<button class="extensionCategoryButton sub" data-category="补丁">补丁</button>
	</div>`;
    document.querySelectorAll(".extensionCategoryButton").forEach((button) => {
        button.addEventListener("click", (event) => {
            const category = event.target.getAttribute("data-category");
            search("[" + category + "]");

            document.querySelectorAll(".extensionCategoryButton").forEach((btn) => {
                btn.classList.add("sub");
            });
            event.target.classList.remove("sub");
        });
    });
    try {
        const plugins = await fetchPluginList();
        for (const plugin of plugins) {
            const repoName = plugin.name;
            try {
                const release = await fetchLatestRelease(repoName);

                const owner = repoName.split('/')[0];
                const packageName = plugin.id;
                const version = plugin.version == "releases" ? release.tag_name : (await fetchPackageJson(repoName, release.tag_name)).version;
                const onlinePluginList = document.createElement('div');

                const extData = await ExtensionRuntime.getExtData();

                let buttonText;
                let buttonDisabled = false;

                if (extData.hasOwnProperty(packageName)) {
                    if (extData[packageName].version == version) {
                        buttonText = '已安装';
                        buttonDisabled = true;
                    } else {
                        buttonText = '更新';
                    }
                } else {
                    buttonText = '安装';
                }

                onlinePluginList.innerHTML += `
                    <section>
                        <div>${plugin.uiName}<small> - ${owner}</small></div>
                        <span>
                            <i>&#xEE59;</i> 扩展包名: ${packageName}<br>
                            <i>&#xEE51;</i> 扩展版本: ${version}<br>
                        </span>
                    </section>
                    <button class="sub installButton" data-package-name="${packageName}" data-repo-name="${repoName}" data-tag-name="${release.tag_name}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
                `;
                onlinePluginList.className = "onlineEtensionCard";

                extensionContainer.appendChild(onlinePluginList);
                onlinePluginList.querySelector(`.installButton`).addEventListener('click', async (event) => {
                    const button = event.target;
                    const repoName = button.getAttribute('data-repo-name');
                    const tagName = button.getAttribute('data-tag-name');
                    const packageName = button.getAttribute('data-package-name');
                    button.disabled = true;
                    button.textContent = '安装中...';
                    downloadAndInstallPlugin(`https://mirror.ghproxy.com/https://github.com/${repoName}/releases/download/${tagName}/extension.zip`, button);
                });

            } catch (error) {
                const errorDisplay = document.createElement('div');
                errorDisplay.innerHTML += `
                    <section>
                        <div>载入这个插件时出现了错误</div>
                        <span>
                            <i>&#xEB97;</i> 错误详情: ${error}<br>
                        </span>
                    </section>
                    <button class="sub" disabled>安装</button>
            `;
                extensionContainer.appendChild(errorDisplay);
            }
        }

    } catch (error) {
        const errorDisplay = document.createElement('div');
        errorDisplay.innerHTML += `
            <section>
                <div>载入在线列表时出现了错误</div>
                <span>
                    <i>&#xEB97;</i> 错误详情: ${error}<br>
                </span>
            </section>
            <button class="sub" disabled>安装</button>
    `;
        extensionContainer.appendChild(errorDisplay);
    }

}

document.getElementById("extensionSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    search(document.getElementById("extensionSearchInput").value);
});

function search(keyword) {
    const extensionContainer = document.getElementById("extensionShopContainer");
    const cards = extensionContainer.querySelectorAll('.onlineEtensionCard');
    cards.forEach(card => {
        const textContent = card.textContent || card.innerText;
        if (textContent.toLowerCase().includes(keyword.toLowerCase())) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}