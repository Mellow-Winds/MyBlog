# 首页数据

- personal.json：email、qq、school、major、description 均使用字符串。description 中写 \n 表示换行，写 \\n 表示字面量反斜杠和 n。文本不会作为 HTML 执行。
- featured.json：数组顺序即展示顺序。source 填相对于项目根目录的真实文件路径，使用 /；支持现有三个阅读板块。title 留空时使用目录清单里的文件名。description 显示在标题和来源之间，支持换行，留空时不显示。文件新增或改名后同步内容清单，并更新 source。
- projects.json：数组项目包含 name、status、description、url。status 使用三个字，当前为“开发中”，以右上角纯文字显示；非空且不满或超过三个字时回退为“开发中”。description 显示在标题下方。整张卡片链接到 url，空或非法链接则只展示内容。最多五列，窄屏减列，末行从左排列，整个网格居中。提示文案“轻触卡片即可访问项目，更多鬼点子生成中...”在网格下方单独居中。
- friend_url/fr_url.json：保留原字段；icon 的 ./icons/ 相对于此清单。运行 npm run sync:friend-links 同步图标。

修改 JSON 后刷新页面即可读取。JSON 不支持注释或尾随逗号；QQ 请保留引号。加载失败时各板块独立处理，当前会话保留最后一次可用数据。精选路径未匹配目录时跳过该项。

验证：node scripts/test-home.mjs 和 node scripts/test-friend-links.mjs。
