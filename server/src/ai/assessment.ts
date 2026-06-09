/**
 * AI 事件研判引擎
 * 基于事件属性生成结构化研判报告
 */

export interface EventAssessment {
  conclusion: string;
  riskLevel: string;
  possibleCauses: string[];
  disposalSuggestions: Array<{ priority: '立即' | '短期' | '跟进'; action: string }>;
  expectedImpact: {
    affectedArea: string;
    duration: string;
    congestionLength: string;
  };
}

// 研判模板库
const TEMPLATES: Record<string, {
  conclusions: string[];
  causes: Record<string, string[]>;
  suggestions: Record<string, Array<{ priority: '立即' | '短期' | '跟进'; action: string }>>;
  impacts: Record<string, { duration: string; congestion: string }>;
}> = {
  accident: {
    conclusions: [
      '{location}处摄像头检测到{typeName}，置信度{confidence}%。现场疑似{detail}，存在人员伤亡和交通中断风险，需立即响应。',
      '{location}发生{typeName}事件，置信度{confidence}%。{detail}占用车道，可能引发二次事故和严重拥堵。',
    ],
    causes: {
      clear: ['驾驶员操作失误（如疲劳驾驶、超速）', '车辆机械故障（如刹车失灵、爆胎）', '天气或路况因素（如路面湿滑、能见度低）', '前方突发状况导致的连锁追尾'],
      rain: ['路面湿滑导致制动距离延长', '能见度降低引发判断失误', '水滑现象导致车辆失控', '雨天视线受阻未及时发现前方障碍'],
      night: ['夜间视线不良导致反应延迟', '疲劳驾驶风险升高', '对向车灯眩光影响判断', '夜间超速行驶'],
      fog: ['浓雾导致能见度急剧下降', '车距判断失误', '未能及时发现前方事故车辆'],
    },
    suggestions: {
      high: [
        { priority: '立即', action: '通知交警、急救和路政部门赶赴现场，同步开启路段可变情报板提示"前方事故，减速避让"' },
        { priority: '立即', action: '调度最近无人机（{droneName}）抵近侦察，回传现场画面确认事故规模和伤亡情况' },
        { priority: '短期', action: '在事故点前后500米设置警示标志，引导车辆从可用车道缓慢通过' },
        { priority: '短期', action: '若占用多条车道，立即启动分流预案，引导车辆绕行' },
        { priority: '跟进', action: '持续跟踪事故处置进展，评估是否需要增派救援力量或延长管制时间' },
      ],
      medium: [
        { priority: '立即', action: '通知交警前往现场处置，通过可变情报板提示"前方事故，注意避让"' },
        { priority: '短期', action: '视情况调度无人机抵近确认，评估是否需要额外支援' },
        { priority: '跟进', action: '确认事故处理完毕后及时恢复交通，记录处置过程用于后续分析' },
      ],
      low: [
        { priority: '立即', action: '关注事件动态，确认是否为轻微刮擦无需出警' },
        { priority: '短期', action: '若无需出警，通过广播提醒涉事车辆移至应急车道或最近出口处理' },
        { priority: '跟进', action: '记录事件信息，纳入月度事故统计' },
      ],
    },
    impacts: {
      high: { duration: '60-120分钟（若涉及人员伤亡则延长至3小时以上）', congestion: '2-5公里' },
      medium: { duration: '30-60分钟', congestion: '1-2公里' },
      low: { duration: '15-30分钟', congestion: '500米-1公里' },
    },
  },
  fire: {
    conclusions: [
      '{location}处检测到{typeName}，置信度{confidence}%。火势{detail}，可能由车辆起火或边坡火灾引发，存在升级为重大事故的风险。',
      '{location}发现{typeName}，置信度{confidence}%。{detail}，需立即核实火源并评估蔓延风险。',
    ],
    causes: {
      clear: ['车辆自燃（发动机过热、电路短路）', '货物起火（易燃品运输、轮胎高温）', '边坡/绿化带火灾（人为抛掷烟头、高温自燃）', '附近施工或焚烧产生的火源扩散'],
      rain: ['电气线路受潮短路引发火花', '雷击引发边坡植被起火', '车辆涉水后电路故障'],
      night: ['夜间视线受限，火情发现滞后', '夜间车辆自燃风险升高（长时间行驶）', '非法焚烧行为'],
      fog: ['浓雾中能见度低，火情不易被发现', '潮湿环境可能导致电气故障', '雾气降低红外检测精度'],
    },
    suggestions: {
      high: [
        { priority: '立即', action: '通知消防、交警和路政部门赶赴现场，启动火灾应急预案' },
        { priority: '立即', action: '调度最近无人机（{droneName}）抵近侦察，通过红外热成像确认火源位置和火势范围' },
        { priority: '短期', action: '在火灾点前后1公里设置警戒区域，必要时封闭车道或组织车辆绕行' },
        { priority: '短期', action: '评估是否需要直升机灭火支援，提前协调空域' },
        { priority: '跟进', action: '持续监测火势变化，评估对交通和周边环境的影响，及时发布更新通告' },
      ],
      medium: [
        { priority: '立即', action: '通知消防部门核实火情，调度无人机抵近确认火势规模和蔓延方向' },
        { priority: '短期', action: '在火灾点附近设置临时限速和警示标志' },
        { priority: '跟进', action: '确认火源类型后通知相关部门处置，评估对交通的持续影响' },
      ],
      low: [
        { priority: '立即', action: '关注火情动态，确认是否为误报（如施工烟雾、焚烧秸秆）' },
        { priority: '短期', action: '若为小火情，通知路政使用车载灭火器先行处置' },
        { priority: '跟进', action: '记录事件信息，标记为潜在隐患点，加强后续监控' },
      ],
    },
    impacts: {
      high: { duration: '2-4小时（大面积火灾则需6小时以上）', congestion: '3-10公里' },
      medium: { duration: '1-2小时', congestion: '1-3公里' },
      low: { duration: '30-60分钟', congestion: '500米-1公里' },
    },
  },
  smoke: {
    conclusions: [
      '{location}处检测到{typeName}，置信度{confidence}%。{detail}，需判断是否为火灾前兆或误报，存在升级风险。',
      '{location}发现{typeName}异常，置信度{confidence}%。{detail}，需尽快核实源头以防演变为火灾。',
    ],
    causes: {
      clear: ['车辆排放超标（老旧柴油车、故障车辆）', '附近施工或焚烧行为', '火灾初期阶段的烟雾扩散', '工业排放或餐饮油烟'],
      rain: ['湿冷空气导致排气管水蒸气凝结', '雨天焚烧行为减少，可能为车辆故障', '电气短路产生烟雾'],
      night: ['夜间红外检测对热源更敏感，可能误报', '夜间非法焚烧或施工', '车辆灯光散射被误判为烟雾'],
      fog: ['雾气与烟雾混合，检测难度增大', '潮湿空气导致排烟更明显', '雾天焚烧行为增多'],
    },
    suggestions: {
      high: [
        { priority: '立即', action: '通知消防部门核实是否为火灾，同步调度最近无人机（{droneName}）抵近侦察' },
        { priority: '立即', action: '开启隧道/路段通风系统，通过可变情报板提示"前方烟雾，开启车灯减速慢行"' },
        { priority: '短期', action: '在烟雾区域前后设置临时限速标志，必要时封闭相关车道' },
        { priority: '跟进', action: '持续监测烟雾扩散趋势，确认源头后决定是否升级响应等级' },
      ],
      medium: [
        { priority: '立即', action: '调度无人机或通知附近巡逻人员核实烟雾源头' },
        { priority: '短期', action: '通过情报板提示过往车辆注意降速，保持安全车距' },
        { priority: '跟进', action: '确认为误报或非火灾源后解除预警，标记为常规事件' },
      ],
      low: [
        { priority: '立即', action: '确认是否为日常排放或施工产生的短暂烟雾' },
        { priority: '短期', action: '若烟雾持续超过10分钟，升级为中等响应' },
        { priority: '跟进', action: '记录为常规监测事件，标记区域和时间段特征' },
      ],
    },
    impacts: {
      high: { duration: '1-2小时（若升级为火灾则延长）', congestion: '1-3公里' },
      medium: { duration: '30-60分钟', congestion: '500米-1公里' },
      low: { duration: '15-30分钟', congestion: '300-500米' },
    },
  },
  congestion: {
    conclusions: [
      '{location}处检测到{typeName}，置信度{confidence}%。当前{detail}，均速下降，可能由事故或高峰车流叠加引起。',
      '{location}发生{typeName}，置信度{confidence}%。{detail}，车流密度超阈值，需关注是否升级为严重拥堵。',
    ],
    causes: {
      clear: ['高峰时段车流集中', '前方匝道汇入或出口排队', '车道缩减或施工占道', '轻微事故导致的连锁缓行', '信号灯配时不合理'],
      rain: ['雨天驾驶速度降低导致通行效率下降', '路面湿滑增加安全车距', '部分车辆故障率上升占用车道', '雨天出行需求变化'],
      night: ['夜间施工占道', '大货车集中通行时段', '夜间照明不足导致车速降低', '夜间出口收费站排队'],
      fog: ['雾天限速导致通行效率下降', '能见度低导致车距增大', '雾天事故风险增加导致的谨慎驾驶'],
    },
    suggestions: {
      high: [
        { priority: '立即', action: '调度无人机（{droneName}）沿拥堵路段巡航，确认拥堵原因和排队长度' },
        { priority: '立即', action: '通过可变情报板和导航APP发布拥堵预警，引导车辆提前绕行或错峰出行' },
        { priority: '短期', action: '若因事故导致，立即启动事故处置流程；若为流量过大，协调交警加强疏导' },
        { priority: '跟进', action: '持续监测拥堵发展趋势，评估是否需要临时开放应急车道或启动分流方案' },
      ],
      medium: [
        { priority: '立即', action: '通过情报板提示后方车辆注意降速，保持安全车距' },
        { priority: '短期', action: '若拥堵持续超过30分钟，调度无人机巡航确认原因' },
        { priority: '跟进', action: '分析拥堵成因，纳入高峰时段预警模型' },
      ],
      low: [
        { priority: '立即', action: '关注拥堵动态，确认是否为常规高峰缓行' },
        { priority: '短期', action: '若拥堵指数持续上升，升级响应等级' },
        { priority: '跟进', action: '记录为常规缓行事件，用于优化信号配时和匝道管控' },
      ],
    },
    impacts: {
      high: { duration: '1-3小时', congestion: '3-8公里' },
      medium: { duration: '30-90分钟', congestion: '1-3公里' },
      low: { duration: '15-30分钟', congestion: '500米-1公里' },
    },
  },
  obstacle: {
    conclusions: [
      '{location}处检测到{typeName}，置信度{confidence}%。{detail}，存在追尾和车辆受损风险，需及时清理。',
      '{location}发现{typeName}，置信度{confidence}%。{detail}，后方车辆紧急避让可能引发事故。',
    ],
    causes: {
      clear: ['货车货物固定不牢导致抛洒', '交通事故散落物', '人为丢弃或施工遗留物', '路面损坏产生的碎石或坑洞'],
      rain: ['雨水冲刷导致边坡碎石滚落', '积水掩盖路面障碍物', '雨天货物固定更易松动'],
      night: ['夜间视线不良导致未能及时发现', '夜间施工遗留物未及时清理', '夜间货车运输频繁，抛洒概率增加'],
      fog: ['浓雾中驾驶员未能及时发现并避让', '雾天施工安全设施摆放不规范'],
    },
    suggestions: {
      high: [
        { priority: '立即', action: '通知路政养护部门立即前往清理，同时通过情报板提示"前方障碍物，减速避让"' },
        { priority: '立即', action: '调度最近无人机（{droneName}）抵近确认障碍物类型和尺寸，评估清理难度' },
        { priority: '短期', action: '在障碍物后方200米设置警示标志和锥桶，必要时临时封闭相关车道' },
        { priority: '跟进', action: '清理完毕后检查路面是否受损，记录抛洒源车辆信息移交交警追责' },
      ],
      medium: [
        { priority: '立即', action: '通知养护部门前往清理，通过情报板提示"注意路面障碍"' },
        { priority: '短期', action: '评估是否需要临时封闭车道进行清理作业' },
        { priority: '跟进', action: '确认清理完毕后恢复交通，记录事件信息' },
      ],
      low: [
        { priority: '立即', action: '关注障碍物是否已被自然移除（如被风吹走、车辆绕行）' },
        { priority: '短期', action: '若障碍物持续存在，通知养护部门处理' },
        { priority: '跟进', action: '记录事件信息，标记为常规路面异常' },
      ],
    },
    impacts: {
      high: { duration: '30-60分钟（大型障碍物需封闭车道清理）', congestion: '1-3公里' },
      medium: { duration: '20-40分钟', congestion: '500米-1公里' },
      low: { duration: '10-20分钟', congestion: '200-500米' },
    },
  },
};

/** 根据事件生成研判报告 */
export function generateAssessment(event: {
  type: string;
  level: string;
  confidence: number;
  roadName: string;
  stakeNumber: string;
  direction: string;
  description?: string;
  weather?: string;
  droneName?: string;
}): EventAssessment {
  const tmpl = TEMPLATES[event.type] || TEMPLATES.accident;
  const typeNames: Record<string, string> = {
    accident: '交通事故', congestion: '拥堵事件', obstacle: '路面障碍物',
    smoke: '烟雾异常', fire: '火焰检测',
  };
  const typeName = typeNames[event.type] || event.type;
  const location = `${event.roadName}${event.stakeNumber}${event.direction}`;
  const weather = event.weather || 'clear';
  const droneName = event.droneName || '最近待命无人机';

  // 1. 研判结论
  const conclusionTmpl = tmpl.conclusions[Math.floor(Math.random() * tmpl.conclusions.length)];
  const conclusion = conclusionTmpl
    .replace('{location}', location)
    .replace('{typeName}', typeName)
    .replace('{confidence}', String(event.confidence))
    .replace('{detail}', event.description || '详情待确认');

  // 2. 风险等级
  const riskLabels: Record<string, string> = {
    high: `高危 — ${typeName}可能由严重事故或火灾引发，虽当前影响有限，但若不及时处置，将导致严重交通中断和次生事故。`,
    medium: `中危 — ${typeName}需要关注和及时处置，若不处理可能升级为高影响事件。`,
    low: `低危 — ${typeName}当前影响有限，建议常规处置和持续观察。`,
  };
  const riskLevel = riskLabels[event.level] || riskLabels.medium;

  // 3. 可能原因
  const weatherCauses = tmpl.causes[weather] || tmpl.causes.clear;
  const shuffledCauses = [...weatherCauses].sort(() => Math.random() - 0.5);
  const possibleCauses = shuffledCauses.slice(0, Math.min(4, shuffledCauses.length)).map(
    (c, i) => `${i + 1}. ${c}`
  );

  // 4. 处置建议
  const suggestions = (tmpl.suggestions[event.level] || tmpl.suggestions.medium).map((s) => ({
    priority: s.priority,
    action: s.action.replace('{droneName}', droneName),
  }));

  // 5. 预计影响
  const impact = tmpl.impacts[event.level] || tmpl.impacts.medium;
  // 估算影响路段（立交周边范围）
  const affectedArea = `${event.roadName}${event.direction}方向周边${event.level === 'high' ? '2' : event.level === 'medium' ? '1.5' : '1'}公里`;

  return {
    conclusion,
    riskLevel,
    possibleCauses,
    disposalSuggestions: suggestions,
    expectedImpact: {
      affectedArea,
      duration: impact.duration,
      congestionLength: impact.congestion,
    },
  };
}
