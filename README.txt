猎杀场 · 第一回合（本地素材版）

打开 index.html 即可运行，无需安装、网络或服务器。
已接入用户文件夹中的全部 8 张原始头像及 9 张原始道具。通过全身图 Logo 核对人物身份。所有原始 PNG 保持不变，网页只调整显示范围和尺寸。

控制
0：重置到等待行动；1–4：聚焦对应行动并显示截至此处的道具余量；5：显示回合结算画面。
重置后，右方向键逐个显示行动；左方向键回退。
H：隐藏/显示控制台及字幕参考线；F：全屏；Esc：退出录制布局。
录制画面固定 16:9，自适应窗口；底部 150 像素（900 高度基准）保留字幕空间。
生命固定 2 点。第一回合已按 PDF 脚本补入防具消耗：GPT 六级套被打掉、Gemini 皮甲被打掉，二者生命未减少。
动效包含行动线绘制、道具图标滑入、目标卡扫描/受击反馈、道具数量变化跳动。
单行动聚焦时，已发生的其他行动以 10% 亮度显示；未发生的行动隐藏。第四步之后进入结算画面，中间显示 “? + 武器图标 + 目标名” 的两条系统战报。

原始 PNG 素材命名（保留原图，勿重新绘制）
assets/portraits/doubao.png    豆包
assets/portraits/claude.png    Claude
assets/portraits/kimi.png      Kimi
assets/portraits/gpt.png       GPT
assets/portraits/grok.png      Grok
assets/portraits/qwen.png      千问
assets/portraits/deepseek.png  DeepSeek
assets/portraits/gemini.png    Gemini

assets/items/fist.png         徒手袭击：拳头
assets/items/knife.png        匕首：横向战术刀
assets/items/revolver.png     左轮
assets/items/sniper.png       大狙：长枪管与瞄准镜
assets/items/leather.png      皮甲：简单无袖护甲
assets/items/vest.png         防弹衣：胸前分块战术背心
assets/items/heavy.png        六级套：带头盔肩甲的重甲
assets/items/intel.png        单人情报：带人像的资料卡
assets/items/equipment.png    道具情报：叠放卡片和立方体

接入图片后刷新。若原文件为其他格式，应同步修改 app.js 的图片路径，不能只改扩展名。
两张网页示意图未在提供的文件夹中，布局依据原对话描述实现。内置浏览器禁止 file 协议，尚未完成浏览器目视验收。

装备清单使用原对话括号中的详细购买记录；豆包为 2 六级套、2 防弹衣、1 皮甲、1 匕首。
第一回合：Claude→GPT 单人情报；DeepSeek→GPT 大狙；Grok→Gemini 单人情报；Grok→Gemini 匕首。
打开页面默认显示完整初始装备。点击“逐个显示”或右方向键后，才逐步扣除行动道具和被打掉的防具。最后一步结算画面显示：? + 大狙图标 + GPT；? + 匕首图标 + Gemini。

