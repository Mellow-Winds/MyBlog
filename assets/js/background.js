window.MyBlogBackground = (() => {
  const solarTerms = {
    spring: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨'],
    summer: ['立夏', '小满', '芒种', '夏至', '小暑', '大暑'],
    autumn: ['立秋', '处暑', '白露', '秋分', '寒露', '霜降'],
    winter: ['立冬', '小雪', '大雪', '冬至', '小寒', '大寒']
  };

  const palettes = [
    {
      key: 'spring', name: '春', english: 'Spring', description: '新芽绿', core: '#A1C795', terms: solarTerms.spring,
      deep: { name: '苍林深处', color: '#356B4B' },
      subthemes: [
        { name: '立春返青', colors: [
          { name: '立春返青', color: '#91B8AA' }, { name: '烟雨青芽', color: '#92BAA9' },
          { name: '春溪浅碧', color: '#94BDA7' }, { name: '晓雾新青', color: '#95BFA6' }
        ] },
        { name: '雨水润芽', colors: [
          { name: '雨水润芽', color: '#97C1A4' }, { name: '叶尖凝露', color: '#9AC39F' },
          { name: '青苗承雨', color: '#9DC59A' }, { name: '新叶初舒', color: '#A1C795' }
        ] },
        { name: '惊蛰抽叶', colors: [
          { name: '惊蛰抽叶', color: '#A4C990' }, { name: '叶隙流光', color: '#A8CA8D' },
          { name: '疏影新绿', color: '#ABCB89' }, { name: '嫩叶摇风', color: '#AFCC86' }
        ] },
        { name: '春分草长', colors: [
          { name: '春分草长', color: '#B2CD82' }, { name: '草色连天', color: '#B1CD84' },
          { name: '原上浅草', color: '#B0CC86' }, { name: '柔枝缀露', color: '#B0CC88' }
        ] },
        { name: '清明柳色', colors: [
          { name: '清明柳色', color: '#AFCB8A' }, { name: '柳烟微雨', color: '#ABCA90' },
          { name: '堤边垂绿', color: '#A7C995' }, { name: '浅碧轻摇', color: '#A3C89B' }
        ] },
        { name: '谷雨晴芽', colors: [
          { name: '谷雨晴芽', color: '#9FC7A0' }, { name: '雨霁芽新', color: '#9AC5A4' },
          { name: '晴光染绿', color: '#96C3A8' }, { name: '暮春新芽', color: '#91C1AB' }
        ] }
      ]
    },
    {
      key: 'summer', name: '夏', english: 'Summer', description: '青蓝水汽', core: '#73B7C6', terms: solarTerms.summer,
      deep: { name: '深海沉碧', color: '#2F6F78' },
      subthemes: [
        { name: '立夏青绿', colors: [
          { name: '立夏青绿', color: '#8CBFAF' }, { name: '夏木初阴', color: '#88BFB1' },
          { name: '藤蔓新青', color: '#85BEB3' }, { name: '绿荫渐深', color: '#81BEB5' }
        ] },
        { name: '小满湖青', colors: [
          { name: '小满湖青', color: '#7DBDB7' }, { name: '浅滩碧水', color: '#7ABCBB' },
          { name: '湖光微漾', color: '#78BABF' }, { name: '水畔青烟', color: '#75B9C2' }
        ] },
        { name: '芒种澄蓝', colors: [
          { name: '芒种澄蓝', color: '#73B7C6' }, { name: '晴川历历', color: '#72B5CA' },
          { name: '潮平岸阔', color: '#71B3CD' }, { name: '碧波万顷', color: '#70B1D1' }
        ] },
        { name: '夏至晴空', colors: [
          { name: '夏至晴空', color: '#6FAFD4' }, { name: '天青欲雨', color: '#73B0D3' },
          { name: '云过留蓝', color: '#76B2D2' }, { name: '远波接天', color: '#7AB3D0' }
        ] },
        { name: '小暑云海', colors: [
          { name: '小暑云海', color: '#7DB4CF' }, { name: '云影浮风', color: '#7FB6C7' },
          { name: '凉风入夏', color: '#81B8BF' }, { name: '海天青碧', color: '#84B9B7' }
        ] },
        { name: '大暑荷风', colors: [
          { name: '大暑荷风', color: '#86BBAF' }, { name: '夏雨初歇', color: '#8CBBA6' },
          { name: '浓荫蔽日', color: '#93BC9D' }, { name: '晚夏草深', color: '#99BC94' }
        ] }
      ]
    },
    {
      key: 'autumn', name: '秋', english: 'Autumn', description: '草木金橙', core: '#D29A5F', terms: solarTerms.autumn,
      deep: { name: '深秋烈焰', color: '#B84A0A' },
      subthemes: [
        { name: '立秋草色', colors: [
          { name: '立秋草色', color: '#9FBC8A' }, { name: '秋青未褪', color: '#A5BB86' },
          { name: '初黄染叶', color: '#ABBA82' }, { name: '秋芽带露', color: '#B1B87D' }
        ] },
        { name: '处暑麦黄', colors: [
          { name: '处暑麦黄', color: '#B7B779' }, { name: '麦浪浮金', color: '#BCB576' },
          { name: '金穗低垂', color: '#C0B273' }, { name: '秋黄满野', color: '#C5B06F' }
        ] },
        { name: '白露金橙', colors: [
          { name: '白露金橙', color: '#C9AD6C' }, { name: '桂子飘香', color: '#CBA869' },
          { name: '金露凝枝', color: '#CEA466' }, { name: '秋蜜流金', color: '#D09F62' }
        ] },
        { name: '秋分暖橙', colors: [
          { name: '秋分暖橙', color: '#D29A5F' }, { name: '夕照层林', color: '#D3955D' },
          { name: '枫光初染', color: '#D4915B' }, { name: '丹橙映日', color: '#D48C5A' }
        ] },
        { name: '寒露枫橙', colors: [
          { name: '寒露枫橙', color: '#D58758' }, { name: '橙光满树', color: '#D2835B' },
          { name: '霜叶似火', color: '#CF7E5D' }, { name: '落焰余温', color: '#CC7A60' }
        ] },
        { name: '霜降暮红', colors: [
          { name: '霜降暮红', color: '#C97562' }, { name: '秋霞漫天', color: '#C6766B' },
          { name: '暖红染枝', color: '#C47873' }, { name: '橙暮余晖', color: '#C1797B' }
        ] }
      ]
    },
    {
      key: 'winter', name: '冬', english: 'Winter', description: '暮紫冰蓝', core: '#919AC7', terms: solarTerms.winter,
      deep: { name: '长夜沉雪', color: '#4C568D' },
      subthemes: [
        { name: '立冬暮色', colors: [
          { name: '立冬暮色', color: '#BE7A83' }, { name: '沉霞入山', color: '#B97B8A' },
          { name: '暮紫微茫', color: '#B47D91' }, { name: '冬霞映雪', color: '#AF7E98' }
        ] },
        { name: '小雪紫霞', colors: [
          { name: '小雪紫霞', color: '#AA7F9F' }, { name: '霞紫凝烟', color: '#A683A5' },
          { name: '紫霜初结', color: '#A287AB' }, { name: '霜影横窗', color: '#9E8BB2' }
        ] },
        { name: '大雪冰紫', colors: [
          { name: '大雪冰紫', color: '#9A8FB8' }, { name: '淡霜铺径', color: '#9892BC' },
          { name: '紫晶映月', color: '#9695BF' }, { name: '霜花满枝', color: '#9397C3' }
        ] },
        { name: '冬至雪青', colors: [
          { name: '冬至雪青', color: '#919AC7' }, { name: '初雪落檐', color: '#8F9DC9' },
          { name: '雪影摇光', color: '#8D9FCA' }, { name: '冬暮苍茫', color: '#8AA2CC' }
        ] },
        { name: '小寒霜蓝', colors: [
          { name: '小寒霜蓝', color: '#88A4CE' }, { name: '冬烟笼水', color: '#88A8CB' },
          { name: '寒暮生烟', color: '#87ACC8' }, { name: '雪夜微明', color: '#87B0C5' }
        ] },
        { name: '大寒冰蓝', colors: [
          { name: '大寒冰蓝', color: '#86B4C2' }, { name: '冬云低垂', color: '#89B5BC' },
          { name: '寒光映雪', color: '#8BB6B6' }, { name: '长冬向暖', color: '#8EB7B0' }
        ] }
      ]
    }
  ];

  palettes.forEach(palette => {
    palette.colors = [];
    palette.subthemes.forEach((subtheme, subthemeIndex) => {
      subtheme.term = palette.terms[subthemeIndex];
      subtheme.colors.forEach(variant => {
        variant.index = palette.colors.length;
        variant.term = subtheme.term;
        variant.variantIndex = subtheme.colors.indexOf(variant);
        palette.colors.push(variant.color);
      });
    });
  });

  const yearColors = palettes.flatMap(palette => palette.colors);
  let globalIndex = 0;
  palettes.forEach(palette => {
    palette.subthemes.forEach(subtheme => {
      subtheme.colors.forEach(variant => {
        variant.globalIndex = globalIndex++;
      });
    });
  });

  const DAY = 86400000;
  const UTC8 = 8 * 3600000;
  let timer;

  function getDate(now = Date.now()) {
    const date = new Date(now + UTC8);
    return {
      year: date.getUTCFullYear(), month: date.getUTCMonth(), date: date.getUTCDate(),
      dayIndex: Math.floor((now + UTC8) / DAY)
    };
  }

  function gradient(index) {
    const wrap = value => (value % yearColors.length + yearColors.length) % yearColors.length;
    return [yearColors[wrap(index - 1)], yearColors[wrap(index)], yearColors[wrap(index + 1)]];
  }

  function getTheme(now = Date.now()) {
    const today = getDate(now);
    let year = today.year;
    if (today.dayIndex < Date.UTC(year, 1, 4) / DAY) year--;
    const elapsedDays = today.dayIndex - Date.UTC(year, 1, 4) / DAY;
    // Fixed 15-day groups; the last group absorbs the year's remaining 5–6 days.
    const termIndex = Math.min(23, Math.floor(elapsedDays / 15));
    const seasonIndex = Math.floor(termIndex / 6);
    // A stable shuffled cycle changes daily without repeats on consecutive days.
    const order = [0, 1, 2, 3];
    let seed = (Math.imul(year, 374761393) + termIndex * 668265263) >>> 0;
    for (let i = 3; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const variantIndex = order[(elapsedDays - termIndex * 15) % 4];
    const globalIndex = termIndex * 4 + variantIndex;
    return {
      ...today, termIndex, seasonIndex, variantIndex, globalIndex,
      palette: palettes[seasonIndex], term: palettes[seasonIndex].terms[termIndex % 6],
      tones: gradient(globalIndex)
    };
  }

  function apply(now = Date.now()) {
    const theme = getTheme(now);
    const root = document.documentElement;
    theme.tones.forEach((color, i) => root.style.setProperty(`--tone-${'abc'[i]}`, color));
    root.style.setProperty('--theme-deep', theme.palette.deep.color);
    root.dataset.season = theme.palette.key;
    root.dataset.solarTerm = theme.term;
    return theme;
  }

  function refresh() {
    clearTimeout(timer);
    const now = Date.now();
    apply(now);
    timer = setTimeout(refresh, DAY - ((now + UTC8) % DAY) + 50);
  }

  function start() {
    refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', refresh);
  }

  function onVisible() {
    if (!document.hidden) refresh();
  }

  return { palettes, yearColors, getDate, gradient, getTheme, apply, start };
})();
