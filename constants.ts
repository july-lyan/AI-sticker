
import { StickerPrompt, StickerTemplate, StickerCategory, StyleDefinition, StickerStyleId } from './types';

// Generic description that defers to the reference image
export const CHARACTER_DESCRIPTION = `
The character is the one depicted in the provided reference image. 
Maintain the key facial features, hair style, and clothing details from the reference image.
`;

export const CUSTOM_PRESETS = [
  "吃火锅", "购物", "咸鱼", "无语", "摆烂", "喝奶茶", "加班", "emo", "开心", "大哭", "摸鱼", "贴贴", 
  "疑惑", "震惊", "晚安", "收到", "谢谢", "加油", "比心", "达咩"
];

export const STYLES: Record<StickerStyleId, StyleDefinition> = {
  popart: {
    id: 'popart',
    label: '🎨 波普艺术 (Pop Art)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY change art style, NOT character features. | STYLE: Pure 2D Pop Art ONLY. MUST have: 1) Very thick bold black outlines (6-8px), 2) Flat solid colors with NO gradients or soft shading, 3) Ben-Day halftone dot patterns for skin/hair (visible red/blue/yellow/cyan dots), 4) Comic book speech bubble with text, 5) High contrast primary colors (red/yellow/blue/black/white), 6) Roy Lichtenstein aesthetic with dramatic expressions. STRICTLY AVOID: any 3D rendering, soft shading, realistic lighting, smooth gradients, 3D Pixar style, nano or banana aesthetic. Pure flat 2D graphic design only.'
  },
  manga: {
    id: 'manga',
    label: '🌸 日漫风格 (Manga)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY change art style, NOT character features. | STYLE: Pure 2D hand-drawn Japanese anime ONLY. MUST have: 1) Very large sparkling eyes (占脸部1/3), 2) Thin clean ink linework, 3) Cel-shaded flat colors with minimal gradients, 4) Typical anime hair with detailed strands and highlights, 5) Simplified nose (just small dots or lines), 6) Kawaii expressions, 7) Pastel color palette. Reference: Studio Ghibli, Kyoto Animation. STRICTLY AVOID: any 3D rendering, 3D Pixar style, western cartoon style, nano or banana aesthetic.'
  },
  game: {
    id: 'game',
    label: '⚔️ 王者荣耀风 (Game Art)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style (can be enhanced with armor/accessories but keep base style), accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY add epic game art treatment, NOT change character identity. | STYLE: Semi-realistic 3D game character art ONLY. MUST have: 1) Detailed facial features with realistic proportions, 2) Dramatic rim lighting and glow effects, 3) Intricate costume details and armor/accessories, 4) Epic heroic poses, 5) Particle effects (sparkles/magic), 6) Rich textures (fabric/metal/leather), 7) Cinematic depth of field. Reference: Honor of Kings, League of Legends splash art. Much more realistic than cartoon styles.'
  },
  ancient: {
    id: 'ancient',
    label: '🎋 古风水墨 (Ancient CN)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color (can add traditional hair ornaments 发簪/发冠), facial features, beauty marks, bandaids, accessories. CLOTHING ADAPTATION: Transform modern clothing into elegant traditional Hanfu with flowing sleeves while keeping similar color scheme and details from reference. ONLY adapt to ancient Chinese aesthetic, NOT change character identity. | STYLE: Traditional Chinese ink painting ONLY. MUST have: 1) Visible ink brush strokes and watercolor bleeding effects, 2) Monochrome or limited color palette (black ink + light washes), 3) Traditional Hanfu clothing with flowing sleeves and elegant layers, 4) Elegant hair ornaments (发簪/发冠) integrated naturally, 5) Soft edges and atmospheric effects, 6) Minimalist background with ink wash mountains/clouds, 7) Calligraphy-style text. Reference: Song Dynasty paintings. STRICTLY AVOID: any 3D rendering, solid flat colors, modern elements, 3D Pixar style, nano or banana aesthetic.'
  },
  '3d': {
    id: '3d',
    label: '🧸 3D 萌趣 (Pixar 3D)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY convert to 3D cute rendering, NOT change character identity. | STYLE: Full 3D rendered Pixar/Disney style ONLY. MUST have: 1) Smooth subsurface scattering skin, 2) Round chubby proportions (big head, small body), 3) Glossy highlights on eyes and surfaces, 4) Soft global illumination with ambient occlusion, 5) Plastic/clay-like texture, 6) Exaggerated squash-and-stretch expressions, 7) Studio lighting setup. Reference: Pixar films (Up, Inside Out), Disney 3D. Very different from 2D anime. STRICTLY AVOID: nano or banana aesthetic.'
  },
  pixel: {
    id: 'pixel',
    label: '👾 像素风 (Pixel Art)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY convert to pixel art style, NOT change character identity. | STYLE: Pure 2D pixel art ONLY. MUST have: 1) Visible individual pixel grid (16x16 or 32x32 resolution style), 2) Limited color palette (16-64 colors max), 3) Sharp jagged edges with NO anti-aliasing, 4) Blocky geometric shapes, 5) Dithering patterns for shading, 6) Retro game aesthetic (8-bit/16-bit era). Reference: Super Nintendo, Stardew Valley. STRICTLY AVOID: any smooth gradients, high-resolution details, 3D rendering, 3D Pixar style, nano or banana aesthetic.'
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: '🌃 赛博朋克 (Cyberpunk)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style (can add futuristic tech enhancements), accessories (glasses/earrings/necklace/watch can be enhanced with tech), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY add cyberpunk aesthetic treatment, NOT change character identity. | STYLE: Dark cyberpunk sci-fi style ONLY. MUST have: 1) Neon lights (hot pink/cyan/purple) as primary light source, 2) Futuristic techwear/cybernetic implants, 3) Glitch/holographic effects, 4) Dark moody background with rain/fog, 5) High contrast lighting (dark shadows + bright neons), 6) Sci-fi UI elements/HUD overlays, 7) Gritty urban atmosphere. Reference: Cyberpunk 2077, Blade Runner. STRICTLY AVOID: bright cheerful colors, nano or banana aesthetic.'
  },
  papercut: {
    id: 'papercut',
    label: '✂️ 剪纸艺术 (Paper Cut)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY convert to paper cutout art style, NOT change character identity. | STYLE: Layered paper cutout art style ONLY. MUST have: 1) Multiple distinct paper layers with visible depth, 2) Drop shadows between each layer (3-5px offset), 3) Flat matte paper texture (no glossiness), 4) Clean vector-cut edges, 5) Limited color palette per layer, 6) Slight texture grain on paper surfaces, 7) Silhouette-based design. Reference: Chinese paper cutting, Eric Carle illustrations. STRICTLY AVOID: any 3D rendering, photorealistic elements, 3D Pixar style, nano or banana aesthetic.'
  },
  watercolor: {
    id: 'watercolor',
    label: '💧 水彩梦幻 (Watercolor)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY change art style, NOT character features. | STYLE: Pure 2D watercolor painting ONLY. MUST have: 1) Soft flowing color gradients with visible watercolor bleeding effects (wet-on-wet technique), 2) Dreamy light halos and luminous glows around edges, 3) Transparent color washes with layered translucent tones, 4) Visible paper texture showing through colors (cold-press watercolor paper grain), 5) Soft blurred edges with NO hard outlines (paint-to-water transitions), 6) Delicate color diffusion patterns and water blooms, 7) Pastel or muted color palette with light airy feel, 8) Painterly brush strokes visible in color application. Reference: Studio Ghibli watercolor backgrounds, Japanese illustration (Mitsumasa Anno), impressionist watercolor art. STRICTLY AVOID: any hard vector outlines, solid flat colors, 3D rendering, photorealistic details, heavy shadows, 3D Pixar style, nano or banana aesthetic. Pure traditional watercolor painting feel only.'
  },
  lineart: {
    id: 'lineart',
    label: '✏️ 简笔线描 (Line Art)',
    description: 'CRITICAL CHARACTER PRESERVATION: MUST preserve 100% of original features: exact hair style/color, facial features, clothing style, accessories (glasses/earrings/necklace/watch), beauty marks, bandaids, nail polish, ALL details from reference image. ONLY change art style, NOT character features. | STYLE: Pure OUTLINE-ONLY line drawing - ABSOLUTELY NO FILLS OR TEXTURES. MUST have: 1) ONLY black outline strokes (2-3px) on white background - NO solid black fills, NO hatching, NO texture fills, 2) Hair should be drawn with OUTLINE STROKES ONLY (individual strands or outline shapes), NEVER solid black mass, 3) Clothing drawn with SIMPLE OUTLINE CONTOURS ONLY, NO fabric texture lines, NO shading lines, 4) Face features as simple outlines: circles/dots for eyes, curved lines for mouth/nose, 5) Ultra-minimalist cartoon sketch style - like quick whiteboard stick figure but slightly more detailed, 6) Clean white negative space everywhere - areas like hair interior, clothing interior should remain WHITE or have minimal sparse lines, 7) Think coloring book outline before coloring - pure contour lines with empty interiors, 8) Casual loose hand-drawn line quality. Reference: Coloring book outlines, simple emoji-style line drawings, minimalist cartoon outlines (like xkcd stick figures but with face details). STRICTLY PROHIBIT: Solid black fills (especially for hair/clothing), hatching/cross-hatching, texture fills, dense line patterns, shading, gradients, realistic details, 3D rendering, colored fills, photorealistic elements. This MUST be pure sparse outline-only line art - imagine drawing with a single pen where you can ONLY draw lines, never fill areas with solid black.'
  }
};

// ========== 2026 新年专题 Prompts (马年) ==========

const NEW_YEAR_FEMALE_PROMPTS: StickerPrompt[] = [
  { id: 'f_ny_1', label: '新年拜年', prompt: '角色穿着红色新年装/旗袍，双手抱拳作揖拜年，笑容甜美，背景有红灯笼和烟花, text bubble: "新年快乐"' },
  { id: 'f_ny_2', label: '放烟花', prompt: '角色仰望天空看绽放的烟花，双手举着小烟花棒，表情惊喜开心，背景是璀璨烟花, text bubble: "好美"' },
  { id: 'f_ny_3', label: '许愿', prompt: '角色双手合十闭眼许愿，背景是星空和"2026"字样，神情虔诚美好, text bubble: "心想事成"' },
  { id: 'f_ny_4', label: '写贺卡', prompt: '角色坐在桌前认真写贺卡/春联，手拿毛笔，桌上有红纸和墨水, text bubble: "送福"' },
  { id: 'f_ny_5', label: '发红包', prompt: '角色手持厚厚的红包，笑着递出去，表情慷慨大方, text bubble: "恭喜发财"' },
  { id: 'f_ny_6', label: '团圆饭', prompt: '角色坐在圆桌旁，拿着筷子开心吃年夜饭，桌上摆满丰盛菜肴, text bubble: "开饭啦"' },
  { id: 'f_ny_7', label: '守岁', prompt: '角色穿着睡衣，困得眼皮打架但还在熬夜，旁边是零食和手机，时钟显示23:59, text bubble: "快到了"' },
  { id: 'f_ny_8', label: '新年暴富', prompt: '角色兴奋地举着"2026暴富"的牌子，周围飘着金币和红包, text bubble: "暴富"' },
  { id: 'f_ny_9', label: '马年吉祥', prompt: '角色抱着可爱的小马玩偶（2026马年），穿着喜庆服装，笑容灿烂, ONLY ONE text bubble: "马年吉祥"' },
  { id: 'f_ny_10', label: '跨年倒计时', prompt: '角色看着倒计时"2026"的大屏幕，双手举高欢呼，背景烟花绽放, text bubble: "3-2-1"' },
  { id: 'f_ny_11', label: '挂灯笼', prompt: '角色踮脚挂红灯笼，表情认真可爱，周围挂满红灯笼和彩带, text bubble: "喜气洋洋"' },
  { id: 'f_ny_12', label: '迎曙光', prompt: '角色站在阳台/海边迎接新年第一缕阳光，表情充满希望，手举"2026"牌子, text bubble: "新年新气象"' },
];

const NEW_YEAR_MALE_PROMPTS: StickerPrompt[] = [
  { id: 'm_ny_1', label: '新年拜年', prompt: '角色穿着红色唐装/新年装，双手抱拳作揖拜年，表情喜庆，背景有红灯笼, text bubble: "恭喜发财"' },
  { id: 'm_ny_2', label: '放烟花', prompt: '角色点燃大烟花，动作潇洒，背景是绚烂的烟花夜空, text bubble: "放！"' },
  { id: 'm_ny_3', label: '许愿', prompt: '角色双手合十许愿，背景是星空和"2026"，表情虔诚, text bubble: "目标达成"' },
  { id: 'm_ny_4', label: '贴春联', prompt: '角色踩在凳子上贴春联，手拿胶水，表情认真, text bubble: "福到"' },
  { id: 'm_ny_5', label: '发红包', prompt: '角色土豪般撒红包，周围红包飞舞，表情豪气, text bubble: "都有"' },
  { id: 'm_ny_6', label: '团圆饭', prompt: '角色大口吃年夜饭，碗里堆满肉，满脸幸福, text bubble: "真香"' },
  { id: 'm_ny_7', label: '守岁', prompt: '角色困得东倒西歪但还在打游戏，旁边是泡面和可乐，电视放着春晚, text bubble: "再等等"' },
  { id: 'm_ny_8', label: '新年暴富', prompt: '角色兴奋地举着"2026暴富"牌子跳起来，周围金光闪闪, text bubble: "发财"' },
  { id: 'm_ny_9', label: '马年大吉', prompt: '角色比出胜利手势，旁边是可爱的金色小马，喜气洋洋, text bubble: "马年大吉"' },
  { id: 'm_ny_10', label: '跨年倒计时', prompt: '角色激动地看着倒计时，双手高举欢呼，背景烟花四射, text bubble: "新年到"' },
  { id: 'm_ny_11', label: '开门红', prompt: '角色推开大门，门外是金光和红包雨，表情惊喜, text bubble: "开门红"' },
  { id: 'm_ny_12', label: '迎曙光', prompt: '角色站在山顶迎接新年日出，张开双臂，表情充满力量, text bubble: "冲2026"' },
];

const NEW_YEAR_CHILD_PROMPTS: StickerPrompt[] = [
  { id: 'c_ny_1', label: '拜年', prompt: '角色穿着红色唐装，双手抱拳可爱地拜年，脸蛋红扑扑, text bubble: "新年好"' },
  { id: 'c_ny_2', label: '看烟花', prompt: '角色仰头看烟花，眼睛里映着烟花的光芒，表情惊叹, text bubble: "哇"' },
  { id: 'c_ny_3', label: '收红包', prompt: '角色双手接红包，眼睛发光，表情兴奋, text bubble: "谢谢"' },
  { id: 'c_ny_4', label: '吃糖葫芦', prompt: '角色举着糖葫芦开心地吃，嘴巴沾满糖，背景有红灯笼, text bubble: "甜甜"' },
  { id: 'c_ny_5', label: '团圆饭', prompt: '角色坐在高椅上吃年夜饭，腮帮子鼓鼓的，很满足, text bubble: "好吃"' },
  { id: 'c_ny_6', label: '放小烟花', prompt: '角色小心翼翼地举着小烟花棒，烟花在闪烁，表情兴奋又紧张, text bubble: "亮亮"' },
  { id: 'c_ny_7', label: '新年愿望', prompt: '角色闭眼许愿，双手合十，背景是闪闪星空, text bubble: "愿望"' },
  { id: 'c_ny_8', label: '穿新衣', prompt: '角色穿着崭新的红色新年装，开心地转圈展示, text bubble: "好看吗"' },
  { id: 'c_ny_9', label: '数红包', prompt: '角色坐在床上认真数红包里的钱，表情专注, text bubble: "1-2-3"' },
  { id: 'c_ny_10', label: '玩马灯', prompt: '角色提着可爱的马形灯笼，蹦蹦跳跳, text bubble: "马马"' },
];

const NEW_YEAR_ELDER_PROMPTS: StickerPrompt[] = [
  { id: 'e_ny_1', label: '发红包', prompt: '角色慈祥地发红包，手里一叠红包，笑容满面, text bubble: "来拿红包"' },
  { id: 'e_ny_2', label: '写春联', prompt: '角色戴着老花镜写春联，毛笔字龙飞凤舞, text bubble: "福"' },
  { id: 'e_ny_3', label: '团圆饭', prompt: '角色坐在主位，看着满桌儿孙，表情欣慰幸福, text bubble: "团圆"' },
  { id: 'e_ny_4', label: '看春晚', prompt: '角色坐在沙发上看春晚，手里嗑瓜子，很惬意, text bubble: "精彩"' },
  { id: 'e_ny_5', label: '包饺子', prompt: '角色熟练地包饺子，旁边已包好一排整齐的饺子, text bubble: "包饺子"' },
  { id: 'e_ny_6', label: '新年祝福', prompt: '角色慈祥地笑着，双手合十送祝福, text bubble: "身体健康"' },
  { id: 'e_ny_7', label: '守岁', prompt: '角色披着毯子熬夜守岁，虽然困但很开心, text bubble: "守岁"' },
  { id: 'e_ny_8', label: '接财神', prompt: '角色虔诚地迎接财神，双手合十, text bubble: "财源广进"' },
  { id: 'e_ny_9', label: '逗孙子', prompt: '角色逗孙子孙女玩红包，其乐融融, text bubble: "乖孙"' },
  { id: 'e_ny_10', label: '全家福', prompt: '角色坐在中间，全家合影，笑得合不拢嘴, text bubble: "茄子"' },
];

const NEW_YEAR_PET_PROMPTS: StickerPrompt[] = [
  { id: 'p_ny_1', label: '新年装', prompt: '宠物穿着红色新年小衣服，戴着红色小帽，呆萌可爱, text bubble: "喵/汪"' },
  { id: 'p_ny_2', label: '抢红包', prompt: '宠物叼着红包跑，一脸得意, text bubble: "是我的"' },
  { id: 'p_ny_3', label: '看烟花', prompt: '宠物看着烟花有点害怕，缩成一团，但很好奇, text bubble: "怕怕"' },
  { id: 'p_ny_4', label: '吃年夜饭', prompt: '宠物也有自己的小碗年夜饭，吃得很香, text bubble: "加鸡腿"' },
  { id: 'p_ny_5', label: '拜年', prompt: '宠物作揖拜年的姿势（前爪并拢），超级可爱, text bubble: "恭喜发财"' },
  { id: 'p_ny_6', label: '玩灯笼', prompt: '宠物玩着红灯笼，被灯笼绳子缠住，很呆萌, text bubble: "救命"' },
  { id: 'p_ny_7', label: '守岁', prompt: '宠物困得打哈欠但还在陪主人守岁, text bubble: "困..."' },
  { id: 'p_ny_8', label: '福气满满', prompt: '宠物旁边贴着"福"字，一脸福气, text bubble: "福"' },
  { id: 'p_ny_9', label: '马年萌宠', prompt: '宠物戴着马形头饰，超级可爱呆萌, text bubble: "马年好"' },
  { id: 'p_ny_10', label: '新年愿望', prompt: '宠物对着星空闭眼，仿佛在许愿, text bubble: "加餐"' },
];

const NEW_YEAR_COUPLE_PROMPTS: StickerPrompt[] = [
  { id: 'cp_ny_1', label: '一起拜年', prompt: '两人穿着红色情侣新年装，一起作揖拜年, text bubble: "新年快乐"' },
  { id: 'cp_ny_2', label: '看烟花', prompt: '两人依偎在一起看烟花，浪漫温馨, text bubble: "好美"' },
  { id: 'cp_ny_3', label: '跨年吻', prompt: '两人在跨年倒计时后亲吻，背景烟花绽放, text bubble: "爱你"' },
  { id: 'cp_ny_4', label: '包饺子', prompt: '两人一起包饺子，面粉弄得到处都是但很开心, text bubble: "合作"' },
  { id: 'cp_ny_5', label: '发红包', prompt: '一人给另一人发红包，收的人眼睛发光, text bubble: "收下"' },
  { id: 'cp_ny_6', label: '年夜饭', prompt: '两人甜蜜地吃年夜饭，互相夹菜, text bubble: "吃这个"' },
  { id: 'cp_ny_7', label: '守岁', prompt: '两人依偎在一起守岁看春晚，温馨甜蜜, text bubble: "陪你"' },
  { id: 'cp_ny_8', label: '新年愿望', prompt: '两人一起许新年愿望，双手合十, text bubble: "一起"' },
  { id: 'cp_ny_9', label: '贴春联', prompt: '一人扶梯子，一人贴春联，配合默契, text bubble: "正了"' },
  { id: 'cp_ny_10', label: '马年吉祥', prompt: '两人比心，背景是马年吉祥物和红灯笼, text bubble: "马年大吉"' },
];

const NEW_YEAR_DUO_PROMPTS: StickerPrompt[] = [
  { id: 'd_ny_1', label: '一起拜年', prompt: '两人穿着新年装一起作揖拜年，表情喜庆, text bubble: "新年好"' },
  { id: 'd_ny_2', label: '放烟花', prompt: '两人一起放烟花，兴奋地欢呼, text bubble: "点火"' },
  { id: 'd_ny_3', label: '干杯', prompt: '两人举杯跨年干杯，开怀大笑, text bubble: "干杯"' },
  { id: 'd_ny_4', label: '抢红包', prompt: '两人低头抢手机红包，表情紧张刺激, text bubble: "抢到了"' },
  { id: 'd_ny_5', label: '年夜饭', prompt: '两人一起吃年夜饭火锅，吃得很香, text bubble: "真香"' },
  { id: 'd_ny_6', label: '守岁', prompt: '两人一起打游戏守岁，精神奕奕, text bubble: "不困"' },
  { id: 'd_ny_7', label: '合影', prompt: '两人在红灯笼下合影，比耶, text bubble: "茄子"' },
  { id: 'd_ny_8', label: '新年暴富', prompt: '两人一起举"暴富"牌子，眼睛发光, text bubble: "发财"' },
  { id: 'd_ny_9', label: '跨年倒计时', prompt: '两人激动地看着倒计时大屏幕，高举双手, text bubble: "3-2-1"' },
  { id: 'd_ny_10', label: '许愿', prompt: '两人一起对着星空许愿, text bubble: "愿望成真"' },
];

const NEW_YEAR_FAMILY_PROMPTS: StickerPrompt[] = [
  { id: 'fam_ny_1', label: '全家福', prompt: '一家人穿着红色新年装整齐合影，喜气洋洋, text bubble: "茄子"' },
  { id: 'fam_ny_2', label: '团圆饭', prompt: '一家人围坐圆桌吃年夜饭，其乐融融, text bubble: "团圆"' },
  { id: 'fam_ny_3', label: '发红包', prompt: '长辈给晚辈发红包，晚辈开心地接过, text bubble: "谢谢"' },
  { id: 'fam_ny_4', label: '包饺子', prompt: '一家人一起包饺子，大人教小孩，温馨有爱, text bubble: "包起来"' },
  { id: 'fam_ny_5', label: '看春晚', prompt: '一家人窝在沙发上看春晚，嗑瓜子, text bubble: "好看"' },
  { id: 'fam_ny_6', label: '放烟花', prompt: '一家人一起在院子放烟花，孩子被举起看, text bubble: "好漂亮"' },
  { id: 'fam_ny_7', label: '守岁', prompt: '一家人围在一起守岁聊天，温馨幸福, text bubble: "守岁"' },
  { id: 'fam_ny_8', label: '贴春联', prompt: '一家人一起贴春联挂灯笼，忙碌喜庆, text bubble: "福到"' },
  { id: 'fam_ny_9', label: '拜年', prompt: '一家人整齐作揖拜年，喜气洋洋, text bubble: "新年好"' },
  { id: 'fam_ny_10', label: '新年愿望', prompt: '一家人一起对着星空许愿, text bubble: "阖家幸福"' },
];

const NEW_YEAR_HUMAN_PET_PROMPTS: StickerPrompt[] = [
  { id: 'hp_ny_1', label: '一起拜年', prompt: '人物和宠物都穿新年装一起拜年，超级可爱, text bubble: "新年好"' },
  { id: 'hp_ny_2', label: '看烟花', prompt: '人物抱着宠物一起看烟花，宠物有点怕缩在怀里, text bubble: "别怕"' },
  { id: 'hp_ny_3', label: '年夜饭', prompt: '人物和宠物各自吃年夜饭，宠物也有专属小碗, text bubble: "一起吃"' },
  { id: 'hp_ny_4', label: '发红包', prompt: '人物给宠物"发红包"，宠物一脸懵, text bubble: "红包"' },
  { id: 'hp_ny_5', label: '守岁', prompt: '人物和宠物一起守岁，宠物困得睁不开眼, text bubble: "坚持"' },
  { id: 'hp_ny_6', label: '合影', prompt: '人物抱着穿新年装的宠物合影，红灯笼背景, text bubble: "茄子"' },
  { id: 'hp_ny_7', label: '放小烟花', prompt: '人物放小烟花，宠物在旁边好奇观看, text bubble: "好看"' },
  { id: 'hp_ny_8', label: '马年装扮', prompt: '人物给宠物戴上马年头饰，宠物无奈配合, text bubble: "萌萌哒"' },
  { id: 'hp_ny_9', label: '收红包', prompt: '宠物叼着红包跑向人物邀功, text bubble: "给你"' },
  { id: 'hp_ny_10', label: '新年愿望', prompt: '人物抱着宠物一起许愿, text bubble: "健康平安"' },
];

// 新年 prompts 映射表
export const NEW_YEAR_PROMPTS: Record<StickerCategory, StickerPrompt[]> = {
  female: NEW_YEAR_FEMALE_PROMPTS,
  male: NEW_YEAR_MALE_PROMPTS,
  child: NEW_YEAR_CHILD_PROMPTS,
  elder: NEW_YEAR_ELDER_PROMPTS,
  pet: NEW_YEAR_PET_PROMPTS,
  couple: NEW_YEAR_COUPLE_PROMPTS,
  duo: NEW_YEAR_DUO_PROMPTS,
  family: NEW_YEAR_FAMILY_PROMPTS,
  human_pet: NEW_YEAR_HUMAN_PET_PROMPTS,
};

const FEMALE_PROMPTS: StickerPrompt[] = [
  { id: 'f_1', label: '喝奶茶', prompt: '角色捧着超大杯奶茶，吸管咬在嘴里，一脸幸福的红晕, text bubble: "续命水"' },
  { id: 'f_2', label: '减肥失败', prompt: '角色一边哭一边往嘴里塞蛋糕，体重秤在旁边显示ERROR, text bubble: "明天再减"' },
  { id: 'f_3', label: '买买买', prompt: '角色双手提满购物袋，虽然累但眼神狂热，仿佛拥有全世界, text bubble: "清空购物车"' },
  { id: 'f_4', label: '吃瓜', prompt: '角色捧着西瓜，眼神八卦地盯着屏幕或别人，嘴角带着坏笑, text bubble: "细说"' },
  { id: 'f_5', label: '化妆', prompt: '角色对着镜子仔细涂口红，气场全开，瞬间变美, text bubble: "精致"' },
  { id: 'f_6', label: '卸妆', prompt: '角色素颜，贴着面膜，头发用发箍箍起来，判若两人, text bubble: "回血"' },
  { id: 'f_7', label: '上班', prompt: '角色画着精致妆容，但眼神充满杀气，穿着职业装快步走, text bubble: "搬砖"' },
  { id: 'f_8', label: '翻白眼', prompt: '角色翻出巨大的白眼，嘴角抽搐，一脸无语, text bubble: "呵呵"' },
  { id: 'f_9', label: '追剧', prompt: '角色抱着抱枕，盯着平板，哭得稀里哗啦用纸巾擦泪, text bubble: "磕到了"' },
  { id: 'f_10', label: '花痴', prompt: '角色看着帅哥（或爱豆照片），眼睛变成爱心，流口水, text bubble: "老公！"' },
  { id: 'f_11', label: '生气', prompt: '角色双手叉腰，头发炸毛，背景燃烧着熊熊烈火, text bubble: "气死我了"' },
  { id: 'f_12', label: '撒娇', prompt: '角色嘟着嘴，眨巴着大眼睛，双手戳手指, text bubble: "人家..."' },
  { id: 'f_13', label: '自拍', prompt: '角色高举手机找角度，嘟嘴剪刀手，背景全是滤镜, text bubble: "美美哒"' },
  { id: 'f_14', label: 'P图', prompt: '角色疯狂点击手机屏幕修图，手指都要按断了, text bubble: "精修"' },
  { id: 'f_15', label: '姨妈痛', prompt: '角色蜷缩在床上，捂着肚子，脸色苍白，生无可恋, text bubble: "渡劫"' },
  { id: 'f_16', label: '收到', prompt: '角色比出一个可爱的敬礼手势，笑容甜美, text bubble: "Get"' },
  { id: 'f_17', label: '在吗', prompt: '角色托着腮帮子，看着手机屏幕等待回复，有点失落, text bubble: "在干嘛"' },
  { id: 'f_18', label: '晚安', prompt: '角色戴着可爱的睡帽，抱着玩偶，关灯, text bubble: "美容觉"' },
  { id: 'f_19', label: '不想洗头', prompt: '角色戴着帽子，把油油的头发塞进去，一脸尴尬, text bubble: "没洗头"' },
  { id: 'f_20', label: '做美甲', prompt: '角色展示刚做好的长指甲，闪闪发光，动作妖娆, text bubble: "绝美"' },
  { id: 'f_21', label: '包治百病', prompt: '角色抱着名牌包包狂蹭，一脸陶醉, text bubble: "真香"' },
  { id: 'f_22', label: '照镜子', prompt: '角色捏着肚子上的肉，一脸惊恐和绝望, text bubble: "又胖了"' },
  { id: 'f_23', label: '瑜伽', prompt: '角色在瑜伽垫上做出高难度动作，表情痛苦面具, text bubble: "自律"' },
  { id: 'f_24', label: '迟到', prompt: '角色穿着高跟鞋狂奔，手里提着包和早餐, text bubble: "打卡！"' },
  { id: 'f_25', label: '八卦', prompt: '角色和闺蜜凑在一起咬耳朵，眼神犀利, text bubble: "跟你说个事"' },
  { id: 'f_26', label: '绿茶', prompt: '角色一脸无辜，眨着大眼睛，茶里茶气, text bubble: "哥哥"' },
  { id: 'f_27', label: '女王', prompt: '角色坐在王座上，翘着二郎腿，眼神睥睨众生, text bubble: "跪下"' },
  { id: 'f_28', label: 'emo', prompt: '角色看着窗外的雨，抱着膝盖，自带忧郁滤镜, text bubble: "网抑云"' },
  { id: 'f_29', label: '社恐', prompt: '角色躲在人群角落，用包挡住脸，想隐身, text bubble: "别看我"' },
  { id: 'f_30', label: '干饭', prompt: '角色面对一桌美食，眼神发光，准备大快朵颐, text bubble: "开动"' },
  { id: 'f_31', label: '好辣', prompt: '角色被辣得嘴唇红肿，不停扇风，还要继续吃, text bubble: "嘶哈"' },
  { id: 'f_32', label: '穷', prompt: '角色看着余额宝，两行清泪流下, text bubble: "吃土"' },
  { id: 'f_33', label: '抓狂', prompt: '角色抓乱头发，尖叫，背景是乱码, text bubble: "啊啊啊"' },
  { id: 'f_34', label: '蔑视', prompt: '角色涂着指甲油，漫不经心地看了一眼，充满不屑, text bubble: "就这？"' },
  { id: 'f_35', label: '惊讶', prompt: '角色捂住嘴巴，眼睛瞪大，瞳孔地震, text bubble: "天哪"' },
  { id: 'f_36', label: '比心', prompt: '角色双手举过头顶比大爱心，或者手指比心, text bubble: "爱你"' },
  { id: 'f_37', label: '拒绝', prompt: '角色双手交叉打叉，表情坚决冷漠, text bubble: "达咩"' },
  { id: 'f_38', label: '疑惑', prompt: '角色歪头，头顶冒出三个问号，手指点嘴唇, text bubble: "不懂"' },
  { id: 'f_39', label: '发工资', prompt: '角色看着手机，瞬间变成星星眼，周围飘着钱, text bubble: "暴富"' },
  { id: 'f_40', label: '我想开了', prompt: '角色头顶开出一朵花，表情佛系，看破红尘, text bubble: "佛了"' },
  { id: 'f_41', label: '累瘫', prompt: '角色回到家直接趴在地毯上，高跟鞋甩飞, text bubble: "电量耗尽"' },
  { id: 'f_42', label: '腹黑', prompt: '角色推眼镜，镜片反光，嘴角露出一丝诡异笑容, text bubble: "呵"' },
  { id: 'f_43', label: '凡尔赛', prompt: '角色漫不经心地展示钻戒，假装苦恼, text bubble: "好烦恼"' },
  { id: 'f_44', label: '强颜欢笑', prompt: '角色脸上挂着僵硬的笑容，眼角挂着泪珠, text bubble: "我没事"' },
  { id: 'f_45', label: '抱大腿', prompt: '角色抱住别人的大腿，星星眼乞求, text bubble: "大佬带我"' },
  { id: 'f_46', label: '谢谢', prompt: '角色飞吻，或者双手合十卖萌, text bubble: "阿里嘎多"' },
  { id: 'f_47', label: '再见', prompt: '角色优雅地挥手，转身只留下背影, text bubble: "不送"' },
  { id: 'f_48', label: '加油', prompt: '角色扎起头发，握拳，充满斗志, text bubble: "冲鸭"' },
  { id: 'f_49', label: '害羞', prompt: '角色脸红得像苹果，双手捂脸，透过指缝偷看, text bubble: "羞羞"' },
  { id: 'f_50', label: '无所谓', prompt: '角色耸肩，摊手，一脸不在乎, text bubble: "随便"' },
  { id: 'f_xmas', label: '圣诞快乐', prompt: '角色戴着圣诞帽，手捧礼物站在装饰华丽的圣诞树旁，灯串闪烁，雪花飘落, text bubble: "圣诞快乐"' },
  { id: 'f_newyear', label: '新年快乐', prompt: '角色手提红灯笼，背景绽放烟花，可出现舞龙舞狮或糖葫芦任一, text bubble: "新年快乐"' }
];

const MALE_PROMPTS: StickerPrompt[] = [
  { id: 'm_1', label: '搬砖', prompt: '角色戴着安全帽，满身灰尘，眼神疲惫但坚毅，扛着重物, text bubble: "搬砖人"' },
  { id: 'm_2', label: '摸鱼', prompt: '角色在办公桌下偷偷玩手机，带着耳机，警惕地看着四周, text bubble: "带薪如厕"' },
  { id: 'm_3', label: '开会', prompt: '角色坐在会议室，双眼无神，魂游天外，手里转着笔, text bubble: "听君一席话"' },
  { id: 'm_4', label: '加班', prompt: '角色深夜面对电脑，胡子拉碴，满脸油光，旁边全是空咖啡罐, text bubble: "通宵"' },
  { id: 'm_5', label: '秃头', prompt: '角色摸着日益稀疏的头顶，看着手里的落发，欲哭无泪, text bubble: "发际线"' },
  { id: 'm_6', label: '工资到账', prompt: '角色看着手机短信，嘴角疯狂上扬，瞬间腰杆挺直, text bubble: "复活"' },
  { id: 'm_7', label: '吃土', prompt: '角色翻开空空如也的钱包，只有一只苍蝇飞出来，凄凉, text bubble: "月光族"' },
  { id: 'm_8', label: '挤地铁', prompt: '角色脸贴在地铁玻璃门上，被挤成照片，表情痛苦, text bubble: "夹缝生存"' },
  { id: 'm_9', label: '甲方爸爸', prompt: '角色跪在地上接电话，一脸谄媚的笑容，不停点头, text bubble: "好的好的"' },
  { id: 'm_10', label: '改方案', prompt: '角色看着电脑屏幕，怒发冲冠，要把键盘掰断, text bubble: "第N版"' },
  { id: 'm_11', label: '下班', prompt: '角色以百米冲刺的速度冲出公司大门，残影状, text bubble: "光速下班"' },
  { id: 'm_12', label: '撸串', prompt: '角色光着膀子（或卷起袖子），大口吃肉，满嘴油, text bubble: "整点？"' },
  { id: 'm_13', label: '喝啤酒', prompt: '角色举着扎啤杯，仰头痛饮，肚子微凸, text bubble: "吨吨吨"' },
  { id: 'm_14', label: '打游戏', prompt: '角色戴着电竞耳机，表情狰狞，手指疯狂操作键盘鼠标, text bubble: "跟上！"' },
  { id: 'm_15', label: '猪队友', prompt: '角色摔耳机，一脸难以置信和愤怒，指着屏幕, text bubble: "带不动"' },
  { id: 'm_16', label: '葛优躺', prompt: '角色瘫在沙发上，像一滩烂泥，手里拿着遥控器, text bubble: "废了"' },
  { id: 'm_17', label: '私房钱', prompt: '角色小心翼翼地把钱藏在鞋垫底下，贼眉鼠眼, text bubble: "小金库"' },
  { id: 'm_18', label: '跪键盘', prompt: '角色跪在机械键盘上，双手捏耳垂，一脸委屈, text bubble: "老婆我错了"' },
  { id: 'm_19', label: '直男', prompt: '角色看着女生生气，挠着头，完全不知道发生了什么, text bubble: "多喝热水"' },
  { id: 'm_20', label: '带娃', prompt: '角色生无可恋地躺在地上，被孩子当马骑，眼神空洞, text bubble: "带娃"' },
  { id: 'm_21', label: '修电脑', prompt: '角色自信地拆开电脑主机，结果冒出一股黑烟, text bubble: "重启试试"' },
  { id: 'm_22', label: '开车路怒', prompt: '角色握着方向盘，青筋暴起，对着窗外大喊, text bubble: "会不会开！"' },
  { id: 'm_23', label: '看球', prompt: '角色激动地从沙发上跳起来，挥舞拳头，啤酒洒了一地, text bubble: "好球！"' },
  { id: 'm_24', label: '钓鱼佬', prompt: '角色全副武装扛着钓具，皮肤晒得黝黑，笑容灿烂, text bubble: "永不空军"' },
  { id: 'm_25', label: '健身', prompt: '角色举着杠铃，面部狰狞，汗如雨下, text bubble: "举铁"' },
  { id: 'm_26', label: '这就是大佬', prompt: '角色戴着墨镜，抽着雪茄，坐姿霸气, text bubble: "大佬"' },
  { id: 'm_27', label: '无语', prompt: '角色面无表情，点了一根烟，看着远方, text bubble: "..."' },
  { id: 'm_28', label: '真香', prompt: '角色之前拒绝，现在端着碗吃得比谁都香, text bubble: "真香"' },
  { id: 'm_29', label: '穷', prompt: '角色穿着破洞的袜子，口袋里掏出空气, text bubble: "求包养"' },
  { id: 'm_30', label: '社畜', prompt: '角色背着沉重的公文包，站在雨中，像一只落汤鸡, text bubble: "生活"' },
  { id: 'm_31', label: '疑惑', prompt: '角色皱着眉，满头问号，不仅黑人问号脸, text bubble: "哈？"' },
  { id: 'm_32', label: '鄙视', prompt: '角色用鼻孔看人，竖起中指（或者向下的大拇指）, text bubble: "弱鸡"' },
  { id: 'm_33', label: '坏笑', prompt: '角色嘴角上扬，挑眉，一脸猥琐或计划通, text bubble: "嘿嘿嘿"' },
  { id: 'm_34', label: '震惊', prompt: '角色下巴掉到了地上，墨镜也滑落下来, text bubble: "卧槽"' },
  { id: 'm_35', label: '收到', prompt: '角色敬礼，表情严肃，像个士兵, text bubble: "收到"' },
  { id: 'm_36', label: '谢谢老板', prompt: '角色双手抱拳，或者作揖，满脸堆笑, text bubble: "老板大气"' },
  { id: 'm_37', label: '在吗', prompt: '角色从门缝里探出头，小心翼翼, text bubble: "借点钱？"' },
  { id: 'm_38', label: '晚安', prompt: '角色戴着眼罩，瞬间入睡，鼻涕泡冒出, text bubble: "苟命要紧"' },
  { id: 'm_39', label: '加油', prompt: '角色对着镜子里的自己握拳，眼神充满血丝, text bubble: "拼了"' },
  { id: 'm_40', label: '我全都要', prompt: '角色张开双臂，把面前的东西都揽入怀中，贪婪状, text bubble: "全都要"' },
  { id: 'm_41', label: '油腻', prompt: '角色撩头发，wink，自以为很帅，其实很油, text bubble: "丫头"' },
  { id: 'm_42', label: '背锅', prompt: '角色背着一口巨大的黑锅，压得喘不过气, text bubble: "我的锅"' },
  { id: 'm_43', label: '单身狗', prompt: '角色在情人节看着情侣，手里拿着火把，并在寒风中吃狗粮, text bubble: "汪汪"' },
  { id: 'm_44', label: 'emo', prompt: '角色坐在马路牙子上，手里拿着快抽完的烟，背景阴暗, text bubble: "我好累"' },
  { id: 'm_45', label: '我想静静', prompt: '角色把自己关在厕所里，坐在马桶上发呆, text bubble: "别烦我"' },
  { id: 'm_46', label: '硬汉', prompt: '角色流血不流泪，即使受伤也竖起大拇指, text bubble: "没事"' },
  { id: 'm_47', label: '兄弟', prompt: '角色勾着另一个人的肩膀，碰杯，义气千秋, text bubble: "走一个"' },
  { id: 'm_48', label: '打脸', prompt: '角色脸肿得很高，上面有红手印，尴尬, text bubble: "打脸"' },
  { id: 'm_49', label: '牛逼', prompt: '角色双手竖起大拇指，表情夸张的赞赏, text bubble: "牛哇"' },
  { id: 'm_50', label: '再见', prompt: '角色潇洒转身挥手，不带走一片云彩, text bubble: "溜了"' },
  { id: 'm_xmas', label: '圣诞快乐', prompt: '角色戴着圣诞帽，抱着礼物站在巨大的圣诞树旁，彩灯闪烁，雪花飘落, text bubble: "圣诞快乐"' },
  { id: 'm_newyear', label: '新年快乐', prompt: '角色手提红灯笼或拿糖葫芦，背景烟花绽放，可出现舞龙舞狮任一, text bubble: "新年快乐"' }
];

const CHILD_PROMPTS: StickerPrompt[] = [
  { id: 'c_1', label: '不想上学', prompt: '角色背着巨大的书包，趴在地上被妈妈拖着走，眼泪鼻涕横流, text bubble: "救命"' },
  { id: 'c_2', label: '写作业', prompt: '角色咬着铅笔头，面前的作业本一片空白，眼神呆滞, text bubble: "太难了"' },
  { id: 'c_3', label: '考了100分', prompt: '角色举着试卷，昂首挺胸，鼻孔朝天，走路带风, text bubble: "学霸"' },
  { id: 'c_4', label: '考砸了', prompt: '角色拿着不及格的试卷，躲在墙角发抖，屁股上仿佛已经感觉到了痛, text bubble: "混合双打"' },
  { id: 'c_5', label: '举手', prompt: '角色在课堂上把手举得高高的，甚至站了起来，一脸急切, text bubble: "选我！"' },
  { id: 'c_6', label: '看动画片', prompt: '角色坐在电视机前，手里拿着零食，目不转睛，张着嘴, text bubble: "哇"' },
  { id: 'c_7', label: '撒娇', prompt: '角色抱着大人的腿，仰着头，眼泪汪汪，星星眼, text bubble: "买给我嘛"' },
  { id: 'c_8', label: '偷吃', prompt: '角色嘴角全是巧克力/奶油，手里拿着空包装袋，一脸无辜, text bubble: "不是我"' },
  { id: 'c_9', label: '捣蛋', prompt: '角色身上全是颜料/泥巴，背景是乱七八糟的房间，还在笑, text bubble: "杰作"' },
  { id: 'c_10', label: '睡觉', prompt: '角色抱着玩偶，睡得四仰八叉，流口水，鼻涕泡, text bubble: "呼呼"' },
  { id: 'c_11', label: '我不听', prompt: '角色双手捂住耳朵，紧闭双眼，大声喊叫, text bubble: "我不听"' },
  { id: 'c_12', label: '要抱抱', prompt: '角色张开双臂，跑向前方，满脸期待, text bubble: "抱抱"' },
  { id: 'c_13', label: '哭闹', prompt: '角色躺在地上打滚，手脚乱蹬，嚎啕大哭, text bubble: "哇！！！"' },
  { id: 'c_14', label: '好奇', prompt: '角色拿着放大镜观察地上的蚂蚁，或者凑近看奇怪的东西, text bubble: "这是啥"' },
  { id: 'c_15', label: '扮鬼脸', prompt: '角色用手拉扯脸皮，吐舌头，做怪相, text bubble: "略略略"' },
  { id: 'c_16', label: '背书包', prompt: '角色背着大书包蹦蹦跳跳，红领巾飘扬, text bubble: "上学去"' },
  { id: 'c_17', label: '挑食', prompt: '角色面对胡萝卜/青椒，把头扭到一边，一脸嫌弃, text bubble: "不吃"' },
  { id: 'c_18', label: '玩泥巴', prompt: '角色浑身是泥，手里捧着泥球，笑得很开心, text bubble: "好玩"' },
  { id: 'c_19', label: '被夸奖', prompt: '角色手里拿着小红花，脸红红的，不好意思又开心, text bubble: "嘿嘿"' },
  { id: 'c_20', label: '秘密', prompt: '角色竖起食指放在嘴边，嘘声状, text bubble: "嘘"' },
  { id: 'c_xmas', label: '圣诞快乐', prompt: '角色戴着圣诞帽，围着圣诞树转圈，手里拿小礼物，兴奋跳跳, text bubble: "圣诞快乐"' },
  { id: 'c_newyear', label: '新年快乐', prompt: '角色提着小红灯笼或拿着糖葫芦，看烟花，旁边可出现舞狮或糖葫芦任一, text bubble: "新年快乐"' }
];

const ELDER_PROMPTS: StickerPrompt[] = [
  { id: 'e_1', label: '广场舞', prompt: '角色穿着鲜艳的运动服，拿着扇子，动作妖娆，背景是公园, text bubble: "最炫民族风"' },
  { id: 'e_2', label: '下棋', prompt: '角色盯着棋盘，眉头紧锁，手捏棋子，若有所思, text bubble: "将军"' },
  { id: 'e_3', label: '喝茶', prompt: '角色端着紫砂壶，吹气，一脸享受, text bubble: "养生"' },
  { id: 'e_4', label: '看手机', prompt: '角色把手机拿得很远，眯着眼睛，戴着老花镜, text bubble: "看不清"' },
  { id: 'e_5', label: '催婚', prompt: '角色拿着照片，语重心长，眼神充满期待和压迫感, text bubble: "啥时候领证"' },
  { id: 'e_6', label: '发红包', prompt: '角色拿出一叠厚厚的红包，慈祥的笑容, text bubble: "拿去花"' },
  { id: 'e_7', label: '买菜', prompt: '角色推着小拉车，里面装满大葱鸡蛋，神采奕奕, text bubble: "大减价"' },
  { id: 'e_8', label: '打太极', prompt: '角色穿着练功服，动作缓慢柔和，白鹤亮翅, text bubble: "气沉丹田"' },
  { id: 'e_9', label: '带孙子', prompt: '角色背着孩子，或者推着婴儿车，一脸幸福但也有些累, text bubble: "乖孙"' },
  { id: 'e_10', label: '唠叨', prompt: '角色指指点点，嘴巴不停，唾沫横飞, text bubble: "听我说"' },
  { id: 'e_11', label: '养花', prompt: '角色拿着喷壶给花浇水，看着盛开的花朵笑, text bubble: "花开富贵"' },
  { id: 'e_12', label: '不服老', prompt: '角色举着哑铃或者在单杠上，展示肌肉（虽然不多）, text bubble: "老当益壮"' },
  { id: 'e_13', label: '这就是人生', prompt: '角色背着手看夕阳，背影沧桑又从容, text bubble: "看淡了"' },
  { id: 'e_14', label: '点赞', prompt: '角色竖起大拇指，标准的游客照姿势, text bubble: "棒棒哒"' },
  { id: 'e_15', label: '震惊', prompt: '角色摘下眼镜，一脸难以置信, text bubble: "现在的年轻人"' },
  { id: 'e_xmas', label: '圣诞快乐', prompt: '角色戴着圣诞帽，站在圣诞树旁递出礼物，笑得慈祥，彩灯闪烁, text bubble: "圣诞快乐"' },
  { id: 'e_newyear', label: '新年快乐', prompt: '角色手提红灯笼或拿糖葫芦，背景烟花绽放，旁边可出现舞龙舞狮任一, text bubble: "新年快乐"' }
];

const PET_PROMPTS: StickerPrompt[] = [
  { id: 'p_1', label: '暗中观察', prompt: '角色只露出一双眼睛，躲在沙发/窗帘后面, text bubble: "盯..."' },
  { id: 'p_2', label: '拆家', prompt: '角色站在一片狼藉中（咬坏的沙发/纸巾），一脸骄傲或无辜, text bubble: "不是我干的"' },
  { id: 'p_3', label: '讨食', prompt: '角色前爪搭在一起，眼神可怜巴巴，流口水, text bubble: "饿饿饭饭"' },
  { id: 'p_4', label: '睡觉', prompt: '角色卷成一个球，或者肚皮朝上，睡得很死, text bubble: "Zzz"' },
  { id: 'p_5', label: '鄙视', prompt: '角色斜眼看人，眼神犀利，充满不屑, text bubble: "愚蠢的人类"' },
  { id: 'p_6', label: '玩耍', prompt: '角色追着自己的尾巴，或者扑向玩具，动态模糊, text bubble: "嗨起来"' },
  { id: 'p_7', label: '卖萌', prompt: '角色歪着头，眼睛水汪汪，做出可爱姿势, text bubble: "萌萌哒"' },
  { id: 'p_8', label: '生气', prompt: '角色炸毛，龇牙咧嘴，背拱起来, text bubble: "哼"' },
  { id: 'p_9', label: '开心', prompt: '角色吐舌头，摇尾巴，跳来跳去, text bubble: "开心"' },
  { id: 'p_10', label: '惊讶', prompt: '角色瞪大眼睛，毛发竖起，表情震惊, text bubble: "嗯？"' },
  { id: 'p_11', label: '洗澡', prompt: '角色被水淋湿，浑身湿透缩成一团，表情生无可恋, text bubble: "我恨水"' },
  { id: 'p_12', label: '撒娇', prompt: '角色在地上打滚，露出肚皮求摸摸, text bubble: "摸我"' },
  { id: 'p_13', label: '偷吃', prompt: '角色叼着食物飞快逃跑，回头看有没有被发现, text bubble: "溜了溜了"' },
  { id: 'p_14', label: '装死', prompt: '角色四脚朝天，吐舌头，一动不动装死, text bubble: "卒"' },
  { id: 'p_15', label: '打哈欠', prompt: '角色张大嘴巴打哈欠，露出獠牙，表情困倦, text bubble: "困..."' },
  { id: 'p_16', label: '舔毛', prompt: '角色舔自己的爪子或身体，认真梳理毛发, text bubble: "优雅"' },
  { id: 'p_17', label: '踩奶', prompt: '角色在毯子/主人身上踩来踩去，一脸幸福, text bubble: "踩踩"' },
  { id: 'p_18', label: '嫌弃', prompt: '角色看着猫粮/狗粮，扭头就走，一脸高冷, text bubble: "不吃"' },
  { id: 'p_19', label: '护食', prompt: '角色护着食盆，低吼威胁，眼神凶狠, text bubble: "别碰"' },
  { id: 'p_20', label: '晒太阳', prompt: '角色懒洋洋地趴在阳光下，眯着眼睛享受, text bubble: "舒服~"' },
  { id: 'p_xmas', label: '圣诞快乐', prompt: '宠物戴着圣诞帽或鹿角发箍，趴在圣诞树旁抱着小礼物，彩灯闪烁, text bubble: "圣诞快乐"' },
  { id: 'p_newyear', label: '新年快乐', prompt: '宠物系着红围巾或穿小唐装，旁边挂红灯笼，背景烟花绽放，可出现糖葫芦任一, text bubble: "新年快乐"' }
];

const COUPLE_PROMPTS: StickerPrompt[] = [
  { id: 'cp_1', label: '拥抱', prompt: '两个角色紧紧拥抱在一起，温馨甜蜜, text bubble: "抱抱"' },
  { id: 'cp_2', label: '亲亲', prompt: '两个角色亲吻，周围冒出爱心, text bubble: "mua"' },
  { id: 'cp_3', label: '吵架', prompt: '两个角色背对背，各自生闷气, text bubble: "哼"' },
  { id: 'cp_4', label: '撒狗粮', prompt: '两个角色做出甜蜜动作，周围单身狗捂眼睛, text bubble: "幸福"' },
  { id: 'cp_5', label: '牵手', prompt: '两个角色十指紧扣，甜蜜地牵手走路, text bubble: "在一起"' },
  { id: 'cp_6', label: '比心', prompt: '两个角色一起用手比出爱心形状, text bubble: "爱你"' },
  { id: 'cp_7', label: '喂饭', prompt: '一个角色喂另一个角色吃东西，眼神温柔, text bubble: "啊~"' },
  { id: 'cp_8', label: '头靠头', prompt: '两个角色头靠在一起，闭眼享受温馨时刻, text bubble: "甜蜜"' },
  { id: 'cp_9', label: '和好', prompt: '吵架后一个角色主动道歉，另一个转怒为笑, text bubble: "原谅你"' },
  { id: 'cp_10', label: '一起玩手机', prompt: '两个角色并肩坐着一起看手机，笑得很开心, text bubble: "看这个"' },
  { id: 'cp_11', label: '公主抱', prompt: '一个角色把另一个抱起来，姿势浪漫, text bubble: "抱起"' },
  { id: 'cp_12', label: '背影杀', prompt: '两个角色牵手看夕阳，只看到甜蜜背影, text bubble: "浪漫"' },
  { id: 'cp_13', label: '偷亲', prompt: '一个角色偷偷亲另一个的脸颊，对方害羞脸红, text bubble: "偷亲"' },
  { id: 'cp_14', label: '一起睡觉', prompt: '两个角色拥抱着睡觉，表情安详幸福, text bubble: "晚安"' },
  { id: 'cp_15', label: '送礼物', prompt: '一个角色送礼物，另一个惊喜地捂住嘴, text bubble: "惊喜"' },
  { id: 'cp_16', label: '一起做饭', prompt: '两个角色围着围裙一起做饭，虽然厨房有点乱, text bubble: "好吃"' },
  { id: 'cp_17', label: '贴贴', prompt: '两个角色脸贴着脸，做出亲密可爱的表情, text bubble: "贴贴"' },
  { id: 'cp_18', label: '吃醋', prompt: '一个角色看到对方和别人说话，鼓着腮帮子吃醋, text bubble: "哼！"' },
  { id: 'cp_19', label: '庆祝纪念日', prompt: '两个角色拿着蛋糕庆祝，温馨甜蜜, text bubble: "纪念日快乐"' },
  { id: 'cp_20', label: '雨中漫步', prompt: '两个角色共撑一把伞在雨中，靠得很近, text bubble: "浪漫"' },
  { id: 'cp_xmas', label: '圣诞快乐', prompt: '两个角色戴着圣诞帽在圣诞树旁交换礼物，灯串闪烁，氛围甜蜜, text bubble: "圣诞快乐"' },
  { id: 'cp_newyear', label: '新年快乐', prompt: '两个角色手提红灯笼或拿着糖葫芦，看烟花，旁边可出现舞龙舞狮任一, text bubble: "新年快乐"' }
];

const DUO_PROMPTS: StickerPrompt[] = [
  { id: 'd_1', label: '击掌', prompt: '两个角色击掌庆祝，表情兴奋, text bubble: "耶"' },
  { id: 'd_2', label: '加油', prompt: '两个角色互相鼓励，握拳打气, text bubble: "冲鸭"' },
  { id: 'd_3', label: '吃瓜', prompt: '两个角色坐在一起八卦，表情兴奋, text bubble: "细说"' },
  { id: 'd_4', label: '拥抱', prompt: '两个角色友好拥抱，表现友谊, text bubble: "好兄弟"' },
  { id: 'd_5', label: '干杯', prompt: '两个角色举杯碰杯，开怀大笑, text bubble: "干杯"' },
  { id: 'd_6', label: '勾肩搭背', prompt: '两个角色勾肩搭背走路，兄弟情深, text bubble: "铁子"' },
  { id: 'd_7', label: '打游戏', prompt: '两个角色坐在一起打游戏，配合默契, text bubble: "配合"' },
  { id: 'd_8', label: '一起吃饭', prompt: '两个角色面对面吃火锅/烧烤，吃得很香, text bubble: "真香"' },
  { id: 'd_9', label: '互怼', prompt: '两个角色互相吐槽但表情轻松，打打闹闹, text bubble: "你才是"' },
  { id: 'd_10', label: '合照', prompt: '两个角色摆pose拍照，一起比耶或搞怪, text bubble: "拍照"' },
  { id: 'd_11', label: '一起运动', prompt: '两个角色一起跑步/健身，互相鼓励, text bubble: "坚持"' },
  { id: 'd_12', label: '分享零食', prompt: '一个角色分零食给另一个，温馨友爱, text bubble: "给你吃"' },
  { id: 'd_13', label: '窃窃私语', prompt: '两个角色凑在一起说悄悄话，神秘兮兮, text bubble: "告诉你个秘密"' },
  { id: 'd_14', label: '安慰', prompt: '一个角色拍另一个的肩膀安慰，表情温暖, text bubble: "没事的"' },
  { id: 'd_15', label: '一起追剧', prompt: '两个角色窝在沙发上看剧，吃着爆米花, text bubble: "好看"' },
  { id: 'd_16', label: '恶作剧', prompt: '一个角色偷偷整蛊另一个，坏笑, text bubble: "嘿嘿"' },
  { id: 'd_17', label: '比拼', prompt: '两个角色比赛掰手腕/比身高，较劲, text bubble: "我赢"' },
  { id: 'd_18', label: '一起逛街', prompt: '两个角色提着购物袋逛街，开心聊天, text bubble: "买买买"' },
  { id: 'd_19', label: '背靠背', prompt: '两个角色背靠背坐着，各玩手机但很放松, text bubble: "舒服"' },
  { id: 'd_20', label: '一起旅行', prompt: '两个角色背包客装扮，兴奋地出发, text bubble: "出发"' },
  { id: 'd_xmas', label: '圣诞快乐', prompt: '两个角色戴着圣诞帽在圣诞树旁合影，举起礼物，灯串闪烁, text bubble: "圣诞快乐"' },
  { id: 'd_newyear', label: '新年快乐', prompt: '两个角色穿手提红灯笼或拿糖葫芦，背景烟花绽放, text bubble: "新年快乐"' }
];

const FAMILY_PROMPTS: StickerPrompt[] = [
  { id: 'fam_1', label: '全家福', prompt: '一家人整齐排列，开心微笑, text bubble: "幸福"' },
  { id: 'fam_2', label: '带娃', prompt: '成人照顾孩子，温馨场景, text bubble: "宝贝"' },
  { id: 'fam_3', label: '一起玩', prompt: '一家人一起游戏，欢乐氛围, text bubble: "开心"' },
  { id: 'fam_4', label: '庆祝', prompt: '一家人庆祝节日，温馨快乐, text bubble: "团圆"' },
  { id: 'fam_5', label: '一起吃饭', prompt: '一家人围坐餐桌吃饭，其乐融融, text bubble: "开饭啦"' },
  { id: 'fam_6', label: '亲子阅读', prompt: '家长和孩子一起看书，温馨画面, text bubble: "故事时间"' },
  { id: 'fam_7', label: '做家务', prompt: '一家人一起打扫卫生，虽然累但快乐, text bubble: "大扫除"' },
  { id: 'fam_8', label: '郊游', prompt: '一家人背包出游，孩子被举高高, text bubble: "出去玩"' },
  { id: 'fam_9', label: '睡前拥抱', prompt: '父母和孩子睡前拥抱道晚安, text bubble: "晚安"' },
  { id: 'fam_10', label: '陪写作业', prompt: '家长陪孩子写作业，表情复杂, text bubble: "好好写"' },
  { id: 'fam_11', label: '一起看电视', prompt: '一家人窝在沙发上看电视，温馨惬意, text bubble: "追剧"' },
  { id: 'fam_12', label: '过生日', prompt: '一家人围着生日蛋糕，吹蜡烛许愿, text bubble: "生日快乐"' },
  { id: 'fam_13', label: '做饭', prompt: '一家人一起在厨房忙活，虽然手忙脚乱但开心, text bubble: "大厨"' },
  { id: 'fam_14', label: '拍全家福', prompt: '一家人摆pose拍照，搞怪或温馨, text bubble: "拍照啦"' },
  { id: 'fam_15', label: '运动', prompt: '一家人一起跑步/骑车/放风筝, text bubble: "加油"' },
  { id: 'fam_16', label: '视频通话', prompt: '异地的家人视频通话，挥手问候, text bubble: "想你们"' },
  { id: 'fam_17', label: '逛超市', prompt: '一家人推着购物车逛超市，孩子坐在车里, text bubble: "买买买"' },
  { id: 'fam_18', label: '睡觉', prompt: '一家人挤在床上睡觉，温馨拥挤, text bubble: "晚安"' },
  { id: 'fam_19', label: '春节', prompt: '一家人穿新衣服拜年，贴春联放鞭炮, text bubble: "新年快乐"' },
  { id: 'fam_20', label: '修理东西', prompt: '家长修东西，孩子在旁边递工具帮忙, text bubble: "帮忙"' },
  { id: 'fam_xmas', label: '圣诞快乐', prompt: '一家人在圣诞树旁戴圣诞帽拆礼物，彩灯闪烁，氛围温馨, text bubble: "圣诞快乐"' },
  { id: 'fam_newyear', label: '新年快乐', prompt: '一家人穿红色新衣，提红灯笼，看烟花，旁边可出现舞龙舞狮任一, text bubble: "新年快乐"' }
];

const HUMAN_PET_PROMPTS: StickerPrompt[] = [
  { id: 'hp_1', label: '抱抱', prompt: '人物抱着宠物，温馨场景, text bubble: "宝贝"' },
  { id: 'hp_2', label: '玩耍', prompt: '人物和宠物一起玩，互动有爱, text bubble: "一起玩"' },
  { id: 'hp_3', label: '亲亲', prompt: '人物亲吻宠物，温馨可爱, text bubble: "mua"' },
  { id: 'hp_4', label: '散步', prompt: '人物牵着宠物散步，悠闲惬意, text bubble: "遛弯"' },
  { id: 'hp_5', label: '喂食', prompt: '人物给宠物喂食，宠物开心地吃, text bubble: "吃饭饭"' },
  { id: 'hp_6', label: '一起睡觉', prompt: '人物和宠物一起睡觉，温馨画面, text bubble: "晚安"' },
  { id: 'hp_7', label: '洗澡', prompt: '人物给宠物洗澡，宠物一脸生无可恋, text bubble: "不要啊"' },
  { id: 'hp_8', label: '自拍', prompt: '人物和宠物一起自拍，宠物配合或捣乱, text bubble: "拍照"' },
  { id: 'hp_9', label: '抚摸', prompt: '人物温柔抚摸宠物，宠物舒服地眯眼, text bubble: "舒服"' },
  { id: 'hp_10', label: '训练', prompt: '人物训练宠物做动作，给零食奖励, text bubble: "乖"' },
  { id: 'hp_11', label: '一起看电视', prompt: '人物和宠物窝在沙发上看电视, text bubble: "追剧"' },
  { id: 'hp_12', label: '捡球', prompt: '人物扔球，宠物兴奋地追着跑, text bubble: "接住"' },
  { id: 'hp_13', label: '撒娇', prompt: '宠物对人物撒娇，人物被萌化, text bubble: "好可爱"' },
  { id: 'hp_14', label: '看医生', prompt: '人物抱着宠物去看兽医，宠物瑟瑟发抖, text bubble: "别怕"' },
  { id: 'hp_15', label: '过节', prompt: '人物给宠物戴上节日装饰，庆祝节日, text bubble: "节日快乐"' },
  { id: 'hp_16', label: '梳毛', prompt: '人物给宠物梳毛，毛发飞舞, text bubble: "美容"' },
  { id: 'hp_17', label: '阅读', prompt: '人物看书，宠物趴在腿上睡觉, text bubble: "陪伴"' },
  { id: 'hp_18', label: '玩具', prompt: '人物和宠物争抢玩具，打闹互动, text bubble: "是我的"' },
  { id: 'hp_19', label: '拥抱取暖', prompt: '冬天人物和宠物相互取暖拥抱, text bubble: "好暖"' },
  { id: 'hp_20', label: '晒太阳', prompt: '人物和宠物一起懒洋洋地晒太阳, text bubble: "惬意"' },
  { id: 'hp_xmas', label: '圣诞快乐', prompt: '人物和宠物都戴着圣诞帽，在圣诞树旁抱着礼物合影，灯串闪烁, text bubble: "圣诞快乐"' },
  { id: 'hp_newyear', label: '新年快乐', prompt: '人物穿红色唐装/旗袍，宠物系红围巾，旁边挂红灯笼，背景烟花绽放, text bubble: "新年快乐"' }
];

// 四格漫画连续动作生成函数
export function generateComicStages(emotion: string): StickerPrompt[] {
  const templates: Record<string, string[]> = {
    '微笑': [
      '准备微笑，嘴角微微上扬，眼神温柔',
      '开始微笑，露出洁白的牙齿，眼睛微微眯起',
      '微笑高峰，笑容最灿烂，眼睛弯成月牙，脸颊微红',
      '微笑结束，恢复平静，嘴角仍带笑意，眼神满足'
    ],
    '吃火锅': [
      '看到火锅，眼睛发光，表情兴奋期待',
      '拿起筷子，开心地夹起食材',
      '大口吃火锅，满足的表情，眼睛眯起',
      '吃完后满足地摸摸肚子，心满意足'
    ],
    '大哭': [
      '眼眶湿润，开始委屈',
      '眼泪开始流下，表情难过',
      '大声哭泣，泪流满面',
      '哭累了，抽泣着擦眼泪'
    ],
    '加班': [
      '看到加班通知，表情震惊',
      '无奈打开电脑，叹气',
      '疲惫工作，打哈欠',
      '终于下班，松了一口气'
    ],
    '睡觉': [
      '准备睡觉，打哈欠',
      '躺下闭眼，渐渐入睡',
      '熟睡中，睡得很香',
      '睡醒了，伸懒腰'
    ],
    '生气': [
      '开始不高兴，皱眉',
      '越来越生气，咬牙',
      '愤怒爆发，头发炸毛',
      '气得发抖，冒烟'
    ]
  };

  const stages = templates[emotion] || [
    `${emotion} - 准备阶段，动作刚开始`,
    `${emotion} - 进行中，动作逐渐明显`,
    `${emotion} - 高峰阶段，动作最明显`,
    `${emotion} - 结束阶段，动作逐渐收尾`
  ];

  return stages.map((stage, index) => ({
    id: `comic_${emotion}_${index + 1}`,
    label: `${emotion} ${index + 1}/4`,
    prompt: `角色${stage}, text bubble: "${emotion}"`
  }));
}

export const STICKER_TEMPLATES: Record<StickerCategory, StickerTemplate> = {
  female: { label: '👩 女性', prompts: FEMALE_PROMPTS },
  male: { label: '👨 男性', prompts: MALE_PROMPTS },
  child: { label: '👶 儿童', prompts: CHILD_PROMPTS },
  elder: { label: '👴 老人', prompts: ELDER_PROMPTS },
  pet: { label: '🐶 宠物', prompts: PET_PROMPTS },
  couple: { label: '💑 情侣', prompts: COUPLE_PROMPTS },
  duo: { label: '👥 朋友', prompts: DUO_PROMPTS },
  family: { label: '👨‍👩‍👧‍👦 家庭', prompts: FAMILY_PROMPTS },
  human_pet: { label: '👤🐾 人宠', prompts: HUMAN_PET_PROMPTS }
};
